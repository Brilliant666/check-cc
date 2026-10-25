import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../i18n/messages";
import { collectBrowserSignals, isPublicIp, languageRisk, localeRisk, makeSignalScore, normalizeRegion, summarizeSignals, timezoneRisk } from "../client-engine";
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
    const banned = ["独家", "完美支持", "完美支援", "Fully supported", "Полная поддержка", "Google Analytics", "支付地区", "付款地区", "payment-region", "платежного региона", "subscription availability", "账号可信度", "Account trust", "Доверие аккаунта", "AI 环境", "AI 環境", "AI-движок", "AI environment"];
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

describe("region risk helpers", () => {
  it("matches timezones against the selected region", () => {
    expect(timezoneRisk("Asia/Shanghai", "auto")).toBe(1);
    expect(timezoneRisk("Asia/Shanghai", "cn")).toBe(1);
    expect(timezoneRisk("Europe/Moscow", "ru")).toBe(1);
    expect(timezoneRisk("Europe/Moscow", "cn")).toBe(0);
    expect(timezoneRisk("Asia/Tehran", "ir")).toBe(1);
    expect(timezoneRisk("Asia/Hong_Kong", "auto")).toBe(0.6);
    expect(timezoneRisk("Asia/Hong_Kong", "ru")).toBe(0);
    expect(timezoneRisk(null, "auto")).toBe(0);
  });

  it("matches language signals against the selected region", () => {
    expect(languageRisk(["zh-CN"], "cn")).toBe(1);
    expect(languageRisk(["zh-TW"], "auto")).toBe(0.5);
    expect(languageRisk(["ru-RU"], "ru")).toBe(1);
    expect(languageRisk(["ru-RU"], "cn")).toBe(0);
    expect(languageRisk(["fa-IR"], "ir")).toBe(1);
    expect(languageRisk(["en-US"], "auto")).toBe(0);
  });

  it("matches Intl locale against the selected region", () => {
    expect(localeRisk("zh-CN", "cn")).toBe(1);
    expect(localeRisk("zh-HK", "auto")).toBe(0.5);
    expect(localeRisk("ru-RU", "ru")).toBe(1);
    expect(localeRisk("ru-RU", "cn")).toBe(0);
    expect(localeRisk("fa-IR", "ir")).toBe(1);
    expect(localeRisk("en-US", "auto")).toBe(0);
    expect(localeRisk(null, "auto")).toBe(0);
  });
});

describe("collectBrowserSignals", () => {
  afterEach(() => vi.unstubAllGlobals());

  function stubCanvas() {
    vi.stubGlobal("document", {
      createElement: () => ({ getContext: () => ({ font: "", measureText: () => ({ width: 10 }) }) }),
    });
  }

  it("evaluates Russian signals when Russia is the selected target", () => {
    stubCanvas();
    const result = collectBrowserSignals(
      "ru",
      detectorLocaleText.zh,
      detectionConfig,
      { languages: ["ru-RU"], timezone: "Europe/Moscow", locale: "ru-RU", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 YaBrowser/24.1 Chrome/120", platform: "Windows", brands: "Yandex" },
    );
    const byId = Object.fromEntries(result.signals.map((item) => [item.id, item]));

    expect(byId.timezone.contribution).toBe(26);
    expect(byId.language.contribution).toBe(20);
    expect(byId.locale.contribution).toBe(6);
    expect(byId.domesticBrowser.contribution).toBe(8);
    expect(byId.languageVariant.contribution).toBe(0);
    expect(byId.chineseFonts.contribution).toBe(0);
    expect(byId.timezoneOffset.contribution).toBe(0);
  });

  it("keeps Chinese signals scored when mainland China is the selected target", () => {
    stubCanvas();
    const result = collectBrowserSignals(
      "cn",
      detectorLocaleText.zh,
      detectionConfig,
      { languages: ["zh-CN", "zh"], timezone: "Asia/Shanghai", locale: "zh-CN", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120", platform: "Windows", brands: "Google Chrome" },
    );
    const byId = Object.fromEntries(result.signals.map((item) => [item.id, item]));

    expect(byId.timezone.contribution).toBe(26);
    expect(byId.language.contribution).toBe(20);
    expect(byId.languageVariant.contribution).toBe(12);
    expect(byId.locale.contribution).toBe(6);
  });
});
