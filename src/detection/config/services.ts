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
  ipv6: {
    enabled: true,
    endpoint: process.env.NEXT_PUBLIC_IPV6_ENDPOINT?.trim() || "https://api6.ipify.org?format=json",
    timeoutMs: 3000,
  },
  reachability: {
    enabled: true,
    // 覆盖 claude.ai 探测目标；默认使用不受 CORP 限制的边缘诊断路径。
    endpoint: "https://claude.ai/cdn-cgi/trace",
    timeoutMs: 3500,
  },
};
