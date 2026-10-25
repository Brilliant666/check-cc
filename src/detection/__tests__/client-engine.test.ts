import { describe, expect, it } from "vitest";
import { messages } from "../../i18n/messages";
import { isPublicIp, makeSignalScore, normalizeRegion, summarizeSignals } from "../client-engine";
import { detectionConfig } from "../config";
import { detectorLocaleText } from "../locale";
import type { SignalResult } from "../types";

function signal(overrides: Partial<SignalResult>): SignalResult {
  return {
    id: "test",
    label: "test",
    value: "value",
    score: 1,
    weight: 10,
    contribution: 10,
    source: "browser",
    evaluated: true,
    ...overrides,
  };
}

describe("summarizeSignals", () => {
  it("scores fully evaluated signals without normalization", () => {
    const summary = summarizeSignals([
      signal({ id: "a", weight: 20, contribution: 10 }),
      signal({ id: "b", weight: 30, contribution: 30 }),
    ]);

    expect(summary).toEqual({
      score: 40,
      coverage: 100,
      evaluatedCount: 2,
      totalCount: 2,
      hitCount: 2,
    });
  });

  it("does not inflate the score when coverage is incomplete", () => {
    const summary = summarizeSignals([
      signal({ id: "a", weight: 20, contribution: 10 }),
      signal({ id: "b", weight: 20, contribution: 0, evaluated: false }),
    ]);

    expect(summary.score).toBe(10);
    expect(summary.coverage).toBe(50);
    expect(summary.evaluatedCount).toBe(1);
    expect(summary.totalCount).toBe(2);
    expect(summary.hitCount).toBe(1);
  });

  it("keeps a failed network lookup from adding risk", () => {
    const summary = summarizeSignals([
      signal({ id: "timezone", weight: 26, contribution: 26 }),
      signal({ id: "country", weight: 20, contribution: 0, evaluated: false }),
    ]);

    expect(summary.score).toBe(26);
    expect(summary.coverage).toBe(57);
  });

  it("caps the normalized score at 100", () => {
    const summary = summarizeSignals([signal({ weight: 120, contribution: 120 })]);

    expect(summary.score).toBe(100);
  });

  it("excludes zero-weight context signals from coverage and hits", () => {
    const summary = summarizeSignals([
      signal({ id: "weighted", weight: 10, contribution: 5 }),
      signal({ id: "context", weight: 0, contribution: 5 }),
    ]);

    expect(summary).toEqual({
      score: 5,
      coverage: 100,
      evaluatedCount: 1,
      totalCount: 1,
      hitCount: 1,
    });
  });

  it("returns zero coverage when no weighted signal exists", () => {
    expect(summarizeSignals([signal({ weight: 0, contribution: 0 })])).toEqual({
      score: 0,
      coverage: 0,
      evaluatedCount: 0,
      totalCount: 0,
      hitCount: 0,
    });
    expect(summarizeSignals([])).toEqual({
      score: 0,
      coverage: 0,
      evaluatedCount: 0,
      totalCount: 0,
      hitCount: 0,
    });
  });
});

describe("makeSignalScore", () => {
  const text = detectorLocaleText.zh;

  it("marks missing values as not evaluated", () => {
    const missing = makeSignalScore("timezone", "系统时区", null, 26, 0, text, detectionConfig);
    const empty = makeSignalScore("timezone", "系统时区", "", 26, 0, text, detectionConfig);

    expect(missing.evaluated).toBe(false);
    expect(missing.value).toBe(text.unknown);
    expect(empty.evaluated).toBe(false);
  });

  it("uses the configured weight and clamps the score", () => {
    const result = makeSignalScore("timezone", "系统时区", "Asia/Shanghai", 1, 2, text, detectionConfig);

    expect(result.weight).toBe(26);
    expect(result.score).toBe(1);
    expect(result.contribution).toBe(26);
    expect(result.evaluated).toBe(true);
  });

  it("falls back for unknown signals", () => {
    const result = makeSignalScore("custom-signal", "Custom", "value", 7, 0.5, text, detectionConfig);

    expect(result.weight).toBe(7);
    expect(result.contribution).toBe(4);
    expect(result.source).toBe("browser");
  });
});

describe("isPublicIp", () => {
  it.each([
    ["8.8.8.8", true],
    ["1.1.1.1", true],
    ["10.0.0.1", false],
    ["127.0.0.1", false],
    ["192.168.1.1", false],
    ["172.16.0.1", false],
    ["172.32.0.1", true],
    ["169.254.1.1", false],
    ["::1", false],
    ["fc00::1", false],
    ["2001:4860:4860::8888", true],
  ])("classifies %s as public=%s", (ip, expected) => {
    expect(isPublicIp(ip)).toBe(expected);
  });
});

describe("locale content", () => {
  it("avoids unsupported launch claims in every locale", () => {
    const banned = ["独家", "完美支持", "完美支援", "Fully supported", "Полная поддержка", "Google Analytics", "支付地区", "付款地区", "payment-region", "платежного региона", "subscription availability", "账号可信度", "Account trust", "Доверие аккаунта"];
    const serialized = JSON.stringify(messages);
    for (const phrase of banned) expect(serialized).not.toContain(phrase);
    for (const text of Object.values(detectorLocaleText)) {
      expect(text.status.supported).not.toMatch(/完美|Fully supported|Полная поддержка|官方支持|officially supported/);
      expect(text.risk.supported).not.toMatch(/完美|Fully supported|Полная поддержка|官方支持|officially supported/);
    }
  });

  it("ships non-empty recommendations and coverage copy for every locale", () => {
    for (const text of Object.values(detectorLocaleText)) {
      expect(text.coverageLabel).not.toBe("");
      expect(text.coverageInsufficient).not.toBe("");
      expect(text.network.toggleLabel).not.toBe("");
      expect(text.network.toggleHint).not.toBe("");
      expect(text.network.idle).not.toBe("");
      expect(text.network.checking).not.toBe("");
      expect(text.network.success).not.toBe("");
      expect(text.network.failed).not.toBe("");
      expect(text.network.disabled).not.toBe("");
      expect(text.recommendationsTitle).not.toBe("");
      expect(text.recommendations.high).not.toBe("");
      expect(text.recommendations.medium).not.toBe("");
      expect(text.recommendations.low).not.toBe("");
      expect(text.recommendations.incomplete).not.toBe("");
      expect(text.recommendations.limitation).not.toBe("");
      expect(text.recommendations.limitationNetwork).not.toBe("");
      expect(text.recommendations.limitationNetworkFailed).not.toBe("");
      expect(text.risk.unknown).not.toBe("");
      expect(text.report.title).not.toBe("");
      expect(text.report.copy).not.toBe("");
      expect(text.report.download).not.toBe("");
      expect(text.report.context).not.toBe("");
    }
  });
});

describe("normalizeRegion", () => {
  it("collapses hong kong to automatic detection", () => {
    expect(normalizeRegion("hk")).toBe("auto");
    expect(normalizeRegion("cn")).toBe("cn");
  });
});
