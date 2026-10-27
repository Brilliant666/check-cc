import { describe, expect, it } from "vitest";
import { lookupNetworkIntel, parseIpIntelResponse, providerHost } from "../ip-intel";

const ipwhoPayload = {
  ip: "152.70.146.207",
  success: true,
  type: "IPv4",
  country: "United States",
  country_code: "US",
  region: "Arizona",
  city: "Phoenix",
  latitude: 33.4483757,
  longitude: -112.0740433,
  connection: { asn: 31898, org: "Oracle Corporation", isp: "Oracle Corporation" },
};

const ipapiPayload = {
  ip: "152.70.146.207",
  version: "IPv4",
  city: "Phoenix",
  region: "Arizona",
  country: "US",
  country_name: "United States",
  country_code: "US",
  latitude: 33.4484,
  longitude: -112.074,
  asn: "AS31898",
  org: "ORACLE-BMC-31898",
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

describe("parseIpIntelResponse", () => {
  it("normalizes an ipwho.is response", () => {
    expect(parseIpIntelResponse(ipwhoPayload)).toEqual({
      ip: "152.70.146.207",
      countryCode: "US",
      countryName: "United States",
      region: "Arizona",
      city: "Phoenix",
      asn: "AS31898",
      org: "Oracle Corporation",
      isp: "Oracle Corporation",
      latitude: 33.4483757,
      longitude: -112.0740433,
      ipType: "IPv4",
    });
  });

  it("normalizes a flat response and uppercases the country code", () => {
    const intel = parseIpIntelResponse({
      ip: "8.8.8.8",
      country_code: "us",
      country_name: "United States",
      asn: "AS15169",
      org: "Google LLC",
    });

    expect(intel).toMatchObject({ ip: "8.8.8.8", countryCode: "US", asn: "AS15169", org: "Google LLC", ipType: "IPv4" });
  });

  it("normalizes an ipapi.co response", () => {
    expect(parseIpIntelResponse(ipapiPayload)).toMatchObject({
      ip: "152.70.146.207",
      countryCode: "US",
      countryName: "United States",
      city: "Phoenix",
      asn: "AS31898",
      org: "ORACLE-BMC-31898",
      ipType: "IPv4",
    });
  });

  it("rejects provider errors and payloads without an IP", () => {
    expect(parseIpIntelResponse({ success: false, message: "invalid query" })).toBeNull();
    expect(parseIpIntelResponse({ country_code: "US" })).toBeNull();
    expect(parseIpIntelResponse(null)).toBeNull();
    expect(parseIpIntelResponse("not-json")).toBeNull();
  });
});

describe("lookupNetworkIntel", () => {
  const endpoint = "https://ipwho.is/";

  it("returns normalized intel on success", async () => {
    const result = await lookupNetworkIntel({
      endpoint,
      timeoutMs: 1000,
      fetchImpl: (async () => jsonResponse(ipwhoPayload)) as typeof fetch,
    });

    expect(result.status).toBe("ok");
    expect(result.provider).toBe("ipwho.is");
    if (result.status === "ok") expect(result.intel.countryCode).toBe("US");
  });

  it("reports HTTP failures", async () => {
    const result = await lookupNetworkIntel({
      endpoint,
      timeoutMs: 1000,
      fetchImpl: (async () => new Response("upstream error", { status: 502 })) as typeof fetch,
    });

    expect(result).toMatchObject({ status: "failed", reason: "network", provider: "ipwho.is" });
  });

  it("reports invalid JSON and private IP addresses", async () => {
    const invalid = await lookupNetworkIntel({
      endpoint,
      timeoutMs: 1000,
      fetchImpl: (async () => new Response("not json", { status: 200 })) as typeof fetch,
    });
    const privateIp = await lookupNetworkIntel({
      endpoint,
      timeoutMs: 1000,
      fetchImpl: (async () => jsonResponse({ ...ipwhoPayload, ip: "192.168.1.10" })) as typeof fetch,
    });

    expect(invalid).toMatchObject({ status: "failed", reason: "invalid" });
    expect(privateIp).toMatchObject({ status: "failed", reason: "private_ip" });
  });

  it("aborts a hanging request after the timeout", async () => {
    const hangingFetch = ((_input: RequestInfo | URL, init?: RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })) as typeof fetch;

    const result = await lookupNetworkIntel({ endpoint, timeoutMs: 20, fetchImpl: hangingFetch });

    expect(result).toMatchObject({ status: "failed", reason: "timeout" });
  });

  it("reports network errors", async () => {
    const result = await lookupNetworkIntel({
      endpoint,
      timeoutMs: 1000,
      fetchImpl: (async () => { throw new TypeError("offline"); }) as typeof fetch,
    });

    expect(result).toMatchObject({ status: "failed", reason: "network" });
  });

  it("falls back after a rate-limited primary and reports the actual provider", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.includes("ipwho.is")) return new Response("rate limited", { status: 429 });
      return jsonResponse(ipapiPayload);
    }) as typeof fetch;

    const result = await lookupNetworkIntel({
      endpoint,
      fallbackEndpoint: "https://ipapi.co/json/",
      timeoutMs: 1000,
      fetchImpl,
    });

    expect(calls).toEqual(["https://ipwho.is/", "https://ipapi.co/json/"]);
    expect(result).toMatchObject({ status: "ok", provider: "ipapi.co", providers: ["ipwho.is", "ipapi.co"] });
    if (result.status === "ok") expect(result.intel.countryName).toBe("United States");
  });

  it("does not call the fallback when the primary succeeds", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return jsonResponse(ipwhoPayload);
    }) as typeof fetch;

    const result = await lookupNetworkIntel({ endpoint, fallbackEndpoint: "https://ipapi.co/json/", timeoutMs: 1000, fetchImpl });

    expect(calls).toHaveLength(1);
    expect(result).toMatchObject({ status: "ok", provider: "ipwho.is" });
  });

  it("falls back after the primary times out", async () => {
    const fetchImpl = ((input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes("ipwho.is")) {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        });
      }
      return Promise.resolve(jsonResponse(ipapiPayload));
    }) as typeof fetch;

    const result = await lookupNetworkIntel({ endpoint, fallbackEndpoint: "https://ipapi.co/json/", timeoutMs: 20, fetchImpl });

    expect(result).toMatchObject({ status: "ok", provider: "ipapi.co" });
  });

  it("reports every attempted provider after all endpoints fail", async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => (String(input).includes("ipwho.is") ? new Response("", { status: 500 }) : new Response("not json", { status: 200 }))) as typeof fetch;

    const result = await lookupNetworkIntel({ endpoint, fallbackEndpoint: "https://ipapi.co/json/", timeoutMs: 1000, fetchImpl });

    expect(result).toMatchObject({ status: "failed", reason: "invalid", provider: "ipapi.co", providers: ["ipwho.is", "ipapi.co"] });
  });

  it("skips an empty or duplicate fallback endpoint", async () => {
    const calls: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return new Response("", { status: 500 });
    }) as typeof fetch;

    const empty = await lookupNetworkIntel({ endpoint, fallbackEndpoint: "  ", timeoutMs: 1000, fetchImpl });
    const duplicate = await lookupNetworkIntel({ endpoint, fallbackEndpoint: endpoint, timeoutMs: 1000, fetchImpl });

    expect(calls).toEqual([endpoint, endpoint]);
    expect(empty.providers).toEqual(["ipwho.is"]);
    expect(duplicate.providers).toEqual(["ipwho.is"]);
  });
});

describe("providerHost", () => {
  it("extracts the host and tolerates invalid endpoints", () => {
    expect(providerHost("https://ipwho.is/")).toBe("ipwho.is");
    expect(providerHost("https://example.com/api/ip?x=1")).toBe("example.com");
    expect(providerHost("not a url")).toBe("not a url");
  });
});
