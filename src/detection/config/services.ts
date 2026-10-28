// CheckCC 的检测服务配置，用于控制外部 IP 情报等后端检测服务的开关、接口和超时时间。
import type { DetectionServiceConfig } from "./types";

const ipIntelEndpoint = process.env.NEXT_PUBLIC_IP_INTEL_ENDPOINT?.trim() || "https://ipwho.is/";
// An explicitly empty value disables the fallback; an unset value uses the default.
const ipIntelFallbackEnv = process.env.NEXT_PUBLIC_IP_INTEL_FALLBACK_ENDPOINT;
const ipIntelFallbackEndpoint = ipIntelFallbackEnv === undefined ? "https://ipapi.co/json/" : ipIntelFallbackEnv.trim();
const ipIntelEnabled = process.env.NEXT_PUBLIC_IP_INTEL_ENABLED?.trim().toLowerCase() !== "false";

export const serviceConfig: Record<string, DetectionServiceConfig> = {
  ipIntel: {
    enabled: ipIntelEnabled,
    endpoint: ipIntelEndpoint,
    fallbackEndpoint: ipIntelFallbackEndpoint,
    timeoutMs: 3500,
  },
  webrtc: {
    enabled: true,
    endpoint: process.env.NEXT_PUBLIC_WEBRTC_STUN_URL?.trim() || "stun:stun.cloudflare.com:3478",
    timeoutMs: 2500,
  },
};
