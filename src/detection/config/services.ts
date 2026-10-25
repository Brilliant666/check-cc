// CheckCC 的检测服务配置，用于控制外部 IP 情报等后端检测服务的开关、接口和超时时间。
import type { DetectionServiceConfig } from "./types";

const ipIntelEndpoint = process.env.NEXT_PUBLIC_IP_INTEL_ENDPOINT?.trim() || "https://ipwho.is/";
const ipIntelEnabled = process.env.NEXT_PUBLIC_IP_INTEL_ENABLED?.trim().toLowerCase() !== "false";

export const serviceConfig: Record<string, DetectionServiceConfig> = {
  ipIntel: {
    enabled: ipIntelEnabled,
    endpoint: ipIntelEndpoint,
    timeoutMs: 3500,
  },
};
