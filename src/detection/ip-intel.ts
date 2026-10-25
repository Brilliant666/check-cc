// CheckCC 的网络层探测模块，用于在浏览器中查询并归一化公网 IP、国家、ASN 与位置信息。
import { isPublicIp } from "./client-engine";

export type NetworkIntel = {
  ip: string;
  countryCode: string | null;
  countryName: string | null;
  region: string | null;
  city: string | null;
  asn: string | null;
  org: string | null;
  isp: string | null;
  latitude: number | null;
  longitude: number | null;
  ipType: string | null;
};

export type NetworkFailureReason = "timeout" | "network" | "invalid" | "private_ip";

export type NetworkLookupResult =
  | { status: "ok"; intel: NetworkIntel; provider: string }
  | { status: "failed"; reason: NetworkFailureReason; provider: string };

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as UnknownRecord) : null;
}

function asText(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeAsn(value: string | null) {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (/^AS\d+$/.test(upper)) return upper;
  return /^\d+$/.test(upper) ? `AS${upper}` : value;
}

export function providerHost(endpoint: string) {
  try {
    return new URL(endpoint).host;
  } catch {
    return endpoint;
  }
}

// 兼容 ipwho.is 的嵌套结构，以及 ipapi.co 或自建接口常见的扁平结构。
export function parseIpIntelResponse(payload: unknown): NetworkIntel | null {
  const root = asRecord(payload);
  if (!root || root.success === false) return null;
  const ip = asText(root.ip);
  if (!ip) return null;
  const connection = asRecord(root.connection);
  const countryCode = asText(root.country_code) ?? asText(root.countryCode);
  const asn = asText(root.asn) ?? asText(connection?.asn);
  return {
    ip,
    countryCode: countryCode ? countryCode.toUpperCase() : null,
    countryName: asText(root.country) ?? asText(root.country_name) ?? null,
    region: asText(root.region) ?? null,
    city: asText(root.city) ?? null,
    asn: normalizeAsn(asn),
    org: asText(root.org) ?? asText(connection?.org) ?? null,
    isp: asText(root.isp) ?? asText(connection?.isp) ?? null,
    latitude: asNumber(root.latitude) ?? asNumber(root.lat),
    longitude: asNumber(root.longitude) ?? asNumber(root.lon) ?? asNumber(root.lng),
    ipType: asText(root.type) ?? asText(root.ipType) ?? (ip.includes(":") ? "IPv6" : "IPv4"),
  };
}

export type NetworkLookupOptions = {
  endpoint: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
};

export async function lookupNetworkIntel({ endpoint, timeoutMs, fetchImpl = fetch }: NetworkLookupOptions): Promise<NetworkLookupResult> {
  const provider = providerHost(endpoint);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(endpoint, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      credentials: "omit",
      cache: "no-store",
      referrerPolicy: "no-referrer",
    });
    if (!response.ok) return { status: "failed", reason: "network", provider };
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { status: "failed", reason: "invalid", provider };
    }
    const intel = parseIpIntelResponse(payload);
    if (!intel) return { status: "failed", reason: "invalid", provider };
    if (!isPublicIp(intel.ip)) return { status: "failed", reason: "private_ip", provider };
    return { status: "ok", intel, provider };
  } catch {
    return { status: "failed", reason: controller.signal.aborted ? "timeout" : "network", provider };
  } finally {
    clearTimeout(timer);
  }
}
