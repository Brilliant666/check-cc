// CheckCC 的可选 WebRTC 出口探测，用于在用户开启网络层后比较 ICE 候选与 HTTP 出口。
import { isPublicIp } from "./client-engine";

export type WebRtcCandidate = {
  address: string;
  port: number | null;
  protocol: string;
  type: string;
  family: "IPv4" | "IPv6" | "unknown";
};

export type WebRtcProbeStatus = "ok" | "unsupported" | "timeout" | "error";

export type WebRtcProbeResult = {
  status: WebRtcProbeStatus;
  candidates: WebRtcCandidate[];
  publicAddresses: string[];
  privateAddresses: string[];
  timedOut: boolean;
};

export type WebRtcProbeOptions = {
  timeoutMs?: number;
  stunUrl?: string;
};

export type WebRtcAnalysis = {
  publicAddresses: string[];
  ipv6PublicAddresses: string[];
  comparedAddresses: string[];
  // 与 HTTP 出口同协议族但地址不同的候选，常见于多 WAN、多网卡或分流代理，只作上下文展示。
  extraAddresses: string[];
  matchesHttp: boolean | null;
  ipv6Leak: boolean | null;
};

function candidateFamily(address: string): WebRtcCandidate["family"] {
  if (address.endsWith(".local")) return "unknown";
  if (address.includes(":")) return "IPv6";
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(address)) return "IPv4";
  return "unknown";
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function parseIceCandidate(raw: string): WebRtcCandidate | null {
  const value = raw.trim().replace(/^a=/, "");
  const parts = value.split(/\s+/);
  if (parts.length < 8 || !parts[0].startsWith("candidate:")) return null;
  const address = parts[4];
  const port = Number(parts[5]);
  const protocol = parts[2]?.toLowerCase();
  const typeIndex = parts.indexOf("typ");
  const type = typeIndex > 0 ? parts[typeIndex + 1]?.toLowerCase() : "";
  if (!address || !protocol || !type) return null;
  const family = candidateFamily(address);
  if (family === "unknown" && !address.endsWith(".local")) return null;
  return {
    address,
    port: Number.isFinite(port) ? port : null,
    protocol,
    type,
    family,
  };
}

function buildResult(status: WebRtcProbeStatus, timedOut: boolean, candidates: WebRtcCandidate[]): WebRtcProbeResult {
  const deduped = candidates.filter((candidate, index) => candidates.findIndex((item) => item.address === candidate.address && item.port === candidate.port && item.type === candidate.type) === index);
  const publicAddresses = unique(deduped.filter((candidate) => candidate.family !== "unknown" && isPublicIp(candidate.address)).map((candidate) => candidate.address));
  const privateAddresses = unique(deduped.filter((candidate) => candidate.family !== "unknown" && !isPublicIp(candidate.address)).map((candidate) => candidate.address));
  return { status, candidates: deduped, publicAddresses, privateAddresses, timedOut };
}

export async function probeWebRtc(options: WebRtcProbeOptions = {}): Promise<WebRtcProbeResult> {
  const timeoutMs = options.timeoutMs ?? 2500;
  const stunUrl = options.stunUrl ?? "stun:stun.cloudflare.com:3478";
  const PeerConnection = globalThis.RTCPeerConnection;
  if (typeof PeerConnection !== "function") return buildResult("unsupported", false, []);

  const candidates: WebRtcCandidate[] = [];
  return new Promise((resolve) => {
    let peer: RTCPeerConnection | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let settled = false;

    const finish = (status: WebRtcProbeStatus, timedOut: boolean) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      try {
        peer?.close();
      } catch {
        // 浏览器可能在关闭已释放的连接时抛错，结果已经确定，不影响本次探测。
      }
      resolve(buildResult(status, timedOut, candidates));
    };

    timer = setTimeout(() => finish(candidates.length ? "ok" : "timeout", true), timeoutMs);

    try {
      peer = new PeerConnection({ iceServers: [{ urls: stunUrl }] });
      peer.onicecandidate = (event) => {
        if (!event.candidate) {
          finish("ok", false);
          return;
        }
        const parsed = parseIceCandidate(event.candidate.candidate);
        if (parsed) candidates.push(parsed);
      };
      peer.onicegatheringstatechange = () => {
        if (peer?.iceGatheringState === "complete") finish("ok", false);
      };
      try {
        peer.createDataChannel("checkcc");
      } catch {
        // DataChannel 不是收集候选的必要条件，失败时继续尝试 createOffer。
      }
      void peer
        .createOffer()
        .then((offer) => peer?.setLocalDescription(offer))
        .catch(() => finish("error", false));
    } catch {
      finish("error", false);
    }
  });
}

export function normalizeIpAddress(address: string) {
  const value = address.trim().toLowerCase();
  if (!value.includes(":")) return value;
  try {
    return new URL(`http://[${value}]`).hostname.replace(/^\[|\]$/g, "");
  } catch {
    return value;
  }
}

// 只比较同一协议族的出口地址；只要有一个候选等于 HTTP 出口就视为一致，其余地址作为额外出口单独报告。
// 仅有 IPv4 出口时，公网 IPv6 候选单独作为泄漏线索报告。
export function analyzeWebRtc(probe: WebRtcProbeResult, httpIp: string | null): WebRtcAnalysis {
  const publicAddresses = probe.publicAddresses;
  const ipv6PublicAddresses = publicAddresses.filter((address) => address.includes(":"));
  const normalizedHttp = httpIp?.trim() ? normalizeIpAddress(httpIp) : null;
  const comparedAddresses = normalizedHttp ? publicAddresses.filter((address) => address.includes(":") === normalizedHttp.includes(":")) : [];
  const matchesHttp = normalizedHttp && comparedAddresses.length ? comparedAddresses.some((address) => normalizeIpAddress(address) === normalizedHttp) : null;
  const extraAddresses = matchesHttp ? comparedAddresses.filter((address) => normalizeIpAddress(address) !== normalizedHttp) : [];
  const ipv6Leak = normalizedHttp ? (normalizedHttp.includes(":") ? ipv6PublicAddresses.some((address) => normalizeIpAddress(address) !== normalizedHttp) : ipv6PublicAddresses.length > 0) : null;
  return { publicAddresses, ipv6PublicAddresses, comparedAddresses, extraAddresses, matchesHttp, ipv6Leak };
}

function timezoneOffset(timeZone: string, now: Date): number | null {
  try {
    const value = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(now)
      .find((part) => part.type === "timeZoneName")?.value;
    if (!value) return null;
    if (value === "GMT") return 0;
    const match = /^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/.exec(value);
    if (!match) return null;
    const sign = match[1] === "-" ? -1 : 1;
    return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
  } catch {
    return null;
  }
}

// 比较 IP 时区与浏览器时区；同一偏移的不同 IANA 别名视为一致。
export function compareTimezones(ipTimezone: string | null | undefined, browserTimezone: string | null | undefined, now = new Date()): boolean | null {
  const ipZone = ipTimezone?.trim();
  const browserZone = browserTimezone?.trim();
  if (!ipZone || !browserZone) return null;
  if (ipZone === browserZone) return true;
  const ipOffset = timezoneOffset(ipZone, now);
  const browserOffset = timezoneOffset(browserZone, now);
  if (ipOffset === null || browserOffset === null) return null;
  return ipOffset === browserOffset;
}
