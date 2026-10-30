import { afterEach, describe, expect, it, vi } from "vitest";
import { compareIpv6Egress, parseIpv6Response, probeIpv6Egress } from "../ipv6";

describe("parseIpv6Response", () => {
  it("accepts a public IPv6 address", () => {
    expect(parseIpv6Response({ ip: "2606:4700:4700::1111" })).toBe("2606:4700:4700::1111");
  });

  it("rejects IPv4, private, reserved, mapped, and missing payloads", () => {
    expect(parseIpv6Response({ ip: "203.0.113.5" })).toBeNull();
    expect(parseIpv6Response({ ip: "fc00::1" })).toBeNull();
    expect(parseIpv6Response({ ip: "fe80::1" })).toBeNull();
    expect(parseIpv6Response({ ip: "fec0::1" })).toBeNull();
    expect(parseIpv6Response({ ip: "ff02::1" })).toBeNull();
    expect(parseIpv6Response({ ip: "2001:db8::1" })).toBeNull();
    expect(parseIpv6Response({ ip: "::ffff:192.168.1.1" })).toBeNull();
    expect(parseIpv6Response({ ip: "::ffff:8.8.8.8" })).toBeNull();
    expect(parseIpv6Response({ ip: "::1" })).toBeNull();
    expect(parseIpv6Response({ ip: "" })).toBeNull();
    expect(parseIpv6Response(null)).toBeNull();
    expect(parseIpv6Response("2606:4700::1")).toBeNull();
  });
});

describe("compareIpv6Egress", () => {
  it("compares only same-family addresses", () => {
    expect(compareIpv6Egress("2606:4700::1", "2606:4700::1")).toBe("match");
    expect(compareIpv6Egress("2606:4700::1", "2606:4700::2")).toBe("mismatch");
    expect(compareIpv6Egress("2606:4700::1", "203.0.113.5")).toBe("different_family");
    expect(compareIpv6Egress("2606:4700::1", null)).toBe("unavailable");
    expect(compareIpv6Egress(null, "2606:4700::1")).toBe("unavailable");
  });
});

describe("probeIpv6Egress", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("parses a successful IPv6 lookup", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ ip: "2606:4700:4700::1111" }) }) as Response);
    const result = await probeIpv6Egress({ endpoint: "https://api6.ipify.org?format=json", fetchImpl });

    expect(result).toEqual({ status: "ok", ip: "2606:4700:4700::1111" });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api6.ipify.org?format=json",
      expect.objectContaining({ credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer" }),
    );
  });

  it("reports network, invalid, and timeout failures separately", async () => {
    const offline = vi.fn(async () => ({ ok: false, json: async () => ({}) }) as Response);
    await expect(probeIpv6Egress({ endpoint: "https://example.test", fetchImpl: offline })).resolves.toEqual({ status: "unavailable", reason: "network" });

    const invalid = vi.fn(async () => ({ ok: true, json: async () => ({ ip: "203.0.113.5" }) }) as Response);
    await expect(probeIpv6Egress({ endpoint: "https://example.test", fetchImpl: invalid })).resolves.toEqual({ status: "unavailable", reason: "invalid" });

    vi.useFakeTimers();
    const pending = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    });
    const request = probeIpv6Egress({ endpoint: "https://example.test", timeoutMs: 50, fetchImpl: pending });
    await vi.advanceTimersByTimeAsync(60);
    await expect(request).resolves.toEqual({ status: "unavailable", reason: "timeout" });
  });
});
