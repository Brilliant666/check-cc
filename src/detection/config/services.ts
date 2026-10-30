// CheckCC 的检测服务配置，用于控制外部 IP 情报等后端检测服务的开关、接口和超时时间。
import type { DetectionServiceConfig } from "./types";

const ipIntelEndpoint = process.env.NEXT_PUBLIC_IP_INTEL_ENDPOINT?.trim() || "https://ipwho.is/";
// Comma-separated, tried in order. An explicitly empty value disables fallbacks; an unset value uses the default.
// ipapi.co comes last because its free tier is documented as not meant for production use.
export const DEFAULT_IP_INTEL_FALLBACKS = "https://get.geojs.io/v1/ip/geo.json,https://ipapi.co/json/";
const ipIntelFallbackEnv = process.env.NEXT_PUBLIC_IP_INTEL_FALLBACK_ENDPOINT;
const ipIntelFallbackEndpoint = ipIntelFallbackEnv === undefined ? DEFAULT_IP_INTEL_FALLBACKS : ipIntelFallbackEnv.trim();
const ipIntelEnabled = process.env.NEXT_PUBLIC_IP_INTEL_ENABLED?.trim().toLowerCase() !== "false";
// Whether the network-layer checkbox starts ticked. Off unless explicitly "on"/"true", so a
// self-hosted copy stays browser-only by default; visitors can still change it in the settings.
const networkDefaultEnv = process.env.NEXT_PUBLIC_NETWORK_LAYER_DEFAULT?.trim().toLowerCase();
export const networkLayerDefaultOn = ipIntelEnabled && (networkDefaultEnv === "on" || networkDefaultEnv === "true");

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
