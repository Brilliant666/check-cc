// 浏览器侧 IPv6 直连出口探测，用于补充 WebRTC 候选之外的地址族信息。
import { isPublicIp } from "./client-engine";
import { normalizeIpAddress } from "./webrtc";

export type Ipv6ProbeResult =
  | { status: "ok"; ip: string }
  | { status: "unavailable"; reason: "timeout" | "network" | "invalid" };

export type Ipv6Comparison = "match" | "mismatch" | "different_family" | "unavailable";

export type Ipv6ProbeOptions = {
  endpoint: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function parseIpv6Response(payload: unknown): string | null {
  const record = asRecord(payload);
  const ip = typeof record?.ip === "string" ? record.ip.trim() : "";
  // IPv4-mapped 地址代表 IPv4 出口，不能当作原生 IPv6 直连。
  return ip.includes(":") && !/^::ffff:/i.test(ip) && isPublicIp(ip) ? ip : null;
}

// 只有同一地址族的地址才能比较；IPv4 HTTP 出口与 IPv6 直连出口不同属正常双栈差异。
export function compareIpv6Egress(ipv6: string | null, httpIp: string | null): Ipv6Comparison {
  if (!ipv6 || !httpIp) return "unavailable";
  if (!httpIp.includes(":")) return "different_family";
  return normalizeIpAddress(ipv6) === normalizeIpAddress(httpIp) ? "match" : "mismatch";
}

export async function probeIpv6Egress({ endpoint, timeoutMs = 3000, fetchImpl = fetch }: Ipv6ProbeOptions): Promise<Ipv6ProbeResult> {
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
    if (!response.ok) return { status: "unavailable", reason: "network" };
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return { status: "unavailable", reason: "invalid" };
    }
    const ip = parseIpv6Response(payload);
    return ip ? { status: "ok", ip } : { status: "unavailable", reason: "invalid" };
  } catch {
    return { status: "unavailable", reason: controller.signal.aborted ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}
