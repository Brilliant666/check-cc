import { describe, expect, it } from "vitest";
import type { SignalView } from "../client-engine";
import { detectorLocaleText } from "../locale";
import { buildJsonReport, buildTextReport, reportFilename, type DetectionReportInput } from "../report";

const signals: SignalView[] = [
  {
    id: "timezone",
    label: "系统时区",
    value: "Asia/Shanghai",
    score: 1,
    weight: 26,
    contribution: 26,
    source: "browser",
    evaluated: true,
    state: "done",
  },
  {
    id: "language",
    label: "浏览器语言",
    value: "",
    score: 0,
    weight: 20,
    contribution: 0,
    source: "browser",
    evaluated: false,
    state: "unknown",
  },
  {
    id: "browser",
    label: "浏览器/应用环境",
    value: "Chrome / Windows",
    score: 0,
    weight: 0,
    contribution: 0,
    source: "browser",
    evaluated: true,
    state: "done",
  },
];

const input: DetectionReportInput = {
  text: detectorLocaleText.zh,
  summary: {
    score: 20,
    coverage: 50,
    evaluatedCount: 1,
    totalCount: 2,
    hitCount: 1,
  },
  signals,
  score: 20,
  statusLabel: "需要进一步确认",
  riskLabel: "轻度风险",
  regionLabel: "自动检测",
  recommendations: ["建议一", "建议二", detectorLocaleText.zh.recommendations.limitation],
  generatedAt: new Date("2026-10-25T00:00:00.000Z"),
};

describe("buildTextReport", () => {
  it("summarizes the score, coverage, and hits", () => {
    const report = buildTextReport(input);

    expect(report).toContain("CheckCC · Claude 环境检测报告");
    expect(report).toContain("生成时间: 2026-10-25T00:00:00.000Z");
    expect(report).toContain("风险分: 20%");
    expect(report).toContain("可评估覆盖: 50% (1/2)");
    expect(report).toContain("命中信号: 1 / 2");
    expect(report).toContain("状态: 需要进一步确认 · 轻度风险");
    expect(report).toContain("目标地区: 自动检测");
  });

  it("includes weighted, unevaluated, and context signals", () => {
    const report = buildTextReport(input);

    expect(report).toContain("- 系统时区: Asia/Shanghai (权重 26, 贡献 +26)");
    expect(report).toContain("- 浏览器语言: 未检测 (权重 20, 贡献 --)");
    expect(report).toContain("- 浏览器/应用环境: Chrome / Windows (上下文，不计分)");
  });

  it("includes recommendations and the limitation note", () => {
    const report = buildTextReport(input);
    const limitation = detectorLocaleText.zh.recommendations.limitation;

    expect(report).toContain("1. 建议一");
    expect(report).toContain("2. 建议二");
    expect(report).toContain(limitation);
    expect(report.split(limitation)).toHaveLength(2);
  });

  it("renders every locale without empty or invalid fields", () => {
    for (const text of Object.values(detectorLocaleText)) {
      const report = buildTextReport({ ...input, text });

      expect(report).toContain(text.report.title);
      expect(report).not.toContain("undefined");
      expect(report).not.toContain("NaN");
      expect(report.length).toBeGreaterThan(100);
    }
  });
});

describe("buildJsonReport", () => {
  it("exports machine-readable fields", () => {
    const parsed = JSON.parse(buildJsonReport(input));

    expect(parsed.tool).toBe("CheckCC");
    expect(parsed.generatedAt).toBe("2026-10-25T00:00:00.000Z");
    expect(parsed.score).toBe(20);
    expect(parsed.coverage).toEqual({ percent: 50, evaluated: 1, total: 2 });
    expect(parsed.hitCount).toBe(1);
    expect(parsed.signals).toHaveLength(3);
    expect(parsed.signals[1].evaluated).toBe(false);
    expect(parsed.recommendations).toEqual(input.recommendations);
    expect(parsed.limitation).toBe(detectorLocaleText.zh.recommendations.limitation);
  });

  it("uses an explicit network limitation when provided", () => {
    const limitation = detectorLocaleText.zh.recommendations.limitationNetwork;
    const parsed = JSON.parse(buildJsonReport({ ...input, limitation }));

    expect(parsed.limitation).toBe(limitation);
  });
});

describe("reportFilename", () => {
  it("uses the report date", () => {
    expect(reportFilename(new Date("2026-10-25T12:00:00.000Z"))).toBe("checkcc-report-2026-10-25.json");
  });
});
