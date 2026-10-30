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
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  ipType: string | null;
};

export type NetworkFailureReason = "timeout" | "network" | "invalid" | "private_ip";

export type NetworkLookupResult =
  | { status: "ok"; intel: NetworkIntel; provider: string; providers: string[] }
  | { status: "failed"; reason: NetworkFailureReason; provider: string; providers: string[] };

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

// 兼容 ipwho.is 的嵌套结构、GeoJS 的 organization_name，以及 ipapi.co 或自建接口常见的扁平结构。
export function parseIpIntelResponse(payload: unknown): NetworkIntel | null {
  const root = asRecord(payload);
  if (!root || root.success === false) return null;
  const ip = asText(root.ip);
  if (!ip) return null;
  const connection = asRecord(root.connection);
  const timezone = asRecord(root.timezone);
  const countryCode = asText(root.country_code) ?? asText(root.countryCode);
  const asn = asText(root.asn) ?? asText(connection?.asn);
  return {
    ip,
    countryCode: countryCode ? countryCode.toUpperCase() : null,
    countryName: asText(root.country_name) ?? asText(root.country) ?? null,
    region: asText(root.region) ?? null,
    city: asText(root.city) ?? null,
    asn: normalizeAsn(asn),
    org: asText(root.org) ?? asText(connection?.org) ?? asText(root.organization_name) ?? null,
    isp: asText(root.isp) ?? asText(connection?.isp) ?? null,
    timezone: asText(root.timezone) ?? asText(timezone?.id) ?? null,
    latitude: asNumber(root.latitude) ?? asNumber(root.lat),
    longitude: asNumber(root.longitude) ?? asNumber(root.lon) ?? asNumber(root.lng),
    ipType: asText(root.type) ?? asText(root.ipType) ?? asText(root.version) ?? (ip.includes(":") ? "IPv6" : "IPv4"),
  };
}

export type NetworkLookupOptions = {
  endpoint: string;
  // 一个或多个备用接口，用逗号分隔，按顺序尝试。
  fallbackEndpoint?: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
  // 记录被限流接口的冷却截止时间；不传则不跳过任何接口。
  cooldown?: ProviderCooldown;
  now?: () => number;
};

type NetworkAttempt =
  | { status: "ok"; intel: NetworkIntel }
  | { status: "failed"; reason: NetworkFailureReason; rateLimited: boolean };

export type ProviderCooldown = {
  get(provider: string): number | null;
  set(provider: string, until: number): void;
};

// 跨域时浏览器读不到 Retry-After，所以 429 后统一冷却一段时间。
export const RATE_LIMIT_COOLDOWN_MS = 60 * 60 * 1000;
const COOLDOWN_KEY = "checkcc:ip-provider-cooldown";

// 冷却记录只保存接口主机名和截止时间，不保存任何查询结果。
export function sessionCooldown(storage: Pick<Storage, "getItem" | "setItem"> | null = typeof sessionStorage === "undefined" ? null : sessionStorage): ProviderCooldown {
  const read = (): Record<string, number> => {
    try {
      const parsed: unknown = JSON.parse(storage?.getItem(COOLDOWN_KEY) ?? "{}");
      return asRecord(parsed) ? (parsed as Record<string, number>) : {};
    } catch {
      return {};
    }
  };
  return {
    get: (provider) => {
      const until = read()[provider];
      return typeof until === "number" ? until : null;
    },
    set: (provider, until) => {
      try {
        storage?.setItem(COOLDOWN_KEY, JSON.stringify({ ...read(), [provider]: until }));
      } catch {
        // 无痕模式或存储已满时放弃记录，下次检测仍会照常尝试。
      }
    },
  };
}

export function parseEndpointList(...values: Array<string | undefined>) {
  const all = values.flatMap((value) => (value ?? "").split(",")).map((value) => value.trim()).filter(Boolean);
  return all.filter((value, index) => all.indexOf(value) === index);
}

async function fetchNetworkIntel(endpoint: string, timeoutMs: number, fetchImpl: typeof fetch): Promise<NetworkAttempt> {
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
    if (!response.ok) return { status: "failed", reason: "network", rateLimited: response.status === 429 };
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { status: "failed", reason: "invalid", rateLimited: false };
    }
    const intel = parseIpIntelResponse(payload);
    if (!intel) return { status: "failed", reason: "invalid", rateLimited: false };
    if (!isPublicIp(intel.ip)) return { status: "failed", reason: "private_ip", rateLimited: false };
    return { status: "ok", intel };
  } catch {
    return { status: "failed", reason: controller.signal.aborted ? "timeout" : "network", rateLimited: false };
  } finally {
    clearTimeout(timer);
  }
}

export async function lookupNetworkIntel({ endpoint, fallbackEndpoint = "", timeoutMs, fetchImpl = fetch, cooldown, now = Date.now }: NetworkLookupOptions): Promise<NetworkLookupResult> {
  const endpoints = parseEndpointList(endpoint, fallbackEndpoint);
  const providers = endpoints.map(providerHost);
  const cooling = (current: string) => (cooldown?.get(providerHost(current)) ?? 0) > now();
  // 全部接口都在冷却时仍按顺序尝试，避免冷却记录让网络层永远失效。
  const ordered = endpoints.every(cooling) ? endpoints : endpoints.filter((current) => !cooling(current));
  let reason: NetworkFailureReason = "network";

  for (const current of ordered) {
    const attempt = await fetchNetworkIntel(current, timeoutMs, fetchImpl);
    if (attempt.status === "ok") return { status: "ok", intel: attempt.intel, provider: providerHost(current), providers };
    if (attempt.rateLimited) cooldown?.set(providerHost(current), now() + RATE_LIMIT_COOLDOWN_MS);
    reason = attempt.reason;
  }

  return { status: "failed", reason, provider: providers[providers.length - 1] ?? providerHost(endpoint), providers };
}
