// CheckCC 的检测运行器，用于收集浏览器环境并生成按目标地区评分的信号结果。
import { collectBrowserEnvironment, collectBrowserSignals } from "./client-engine";
import { detectionConfig, type DetectionConfig } from "./config";
import type { DetectorLocaleText } from "./locale";
import type { RegionCode, SignalResult } from "./types";

export type DetectionRunResult = {
  signals: SignalResult[];
  browserResult: ReturnType<typeof collectBrowserSignals>;
};

export type DetectionInput = {
  region: RegionCode;
  text: DetectorLocaleText;
  config?: DetectionConfig;
};

export async function runDetection({ region, text, config = detectionConfig }: DetectionInput): Promise<DetectionRunResult> {
  const browser = collectBrowserEnvironment(text);
  const browserResult = collectBrowserSignals(region, text, config, browser);
  return { browserResult, signals: browserResult.signals };
}
