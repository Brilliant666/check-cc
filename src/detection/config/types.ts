// CheckCC 的检测配置类型定义，用于约束运行器、步骤、信号、服务和整体配置结构。
import type { SignalSource } from "../types";

export type DetectionRunnerMode = "sequential" | "parallel" | "grouped";

export type DetectionRunnerConfig = {
  mode: DetectionRunnerMode;
  failFast: boolean;
  defaultTimeoutMs: number;
};

export type DetectionStepConfig = {
  id: string;
  titleKey: string;
  descKey: string;
};

export type DetectionSignalConfig = {
  enabled: boolean;
  labelKey: string;
  source: SignalSource;
  weight: number;
  order: number;
  // 同组信号测的是同一件事，组内贡献合计不超过组内最大权重。
  group?: string;
};

export type DetectionServiceConfig = {
  enabled: boolean;
  endpoint: string;
  fallbackEndpoint?: string;
  timeoutMs: number;
};

export type DetectionConfig = {
  runner: DetectionRunnerConfig;
  steps: DetectionStepConfig[];
  signals: Record<string, DetectionSignalConfig>;
  services: Record<string, DetectionServiceConfig>;
};
