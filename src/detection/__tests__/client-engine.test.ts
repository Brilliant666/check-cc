import { afterEach, describe, expect, it, vi } from "vitest";
import { messages } from "../../i18n/messages";
import { cgClaudeRepoUrl } from "../../site-config";
import { collectBrowserSignals, defaultSignals, isPublicIp, languageRisk, localeRisk, makeSignalScore, regions, summarizeSignals, timezoneRisk } from "../client-engine";
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
    ["100.64.0.1", false],
    ["100.127.255.255", false],
    ["100.128.0.1", true],
    ["127.0.0.1", false],
    ["192.168.1.1", false],
    ["172.16.0.1", false],
    ["172.32.0.1", true],
    ["169.254.1.1", false],
    ["192.0.2.1", false],
    ["198.51.100.1", false],
    ["203.0.113.1", false],
    ["198.18.0.1", false],
    ["224.0.0.1", false],
    ["255.255.255.255", false],
    ["256.1.1.1", false],
    ["1.2.3", false],
    ["::1", false],
    ["::", false],
    ["fc00::1", false],
    ["fe80::1", false],
    ["fe90::1", false],
    ["fec0::1", false],
    ["ff02::1", false],
    ["2001:db8::1", false],
    ["::ffff:192.168.1.1", false],
    ["::ffff:8.8.8.8", true],
    ["2001:4860:4860::8888", true],
  ])("classifies %s as public=%s", (ip, expected) => {
    expect(isPublicIp(ip)).toBe(expected);
  });
});

describe("locale content", () => {
  it("avoids unsupported launch claims in every locale", () => {
    const banned = ["独家", "完美支持", "完美支援", "Fully supported", "Полная поддержка", "Google Analytics", "支付地区", "付款地区", "payment-region", "платежного региона", "subscription availability", "账号可信度", "Account trust", "Доверие аккаунта", "AI 环境", "AI 環境", "AI-движок", "AI environment", "checkcc.org", "Live Demo", "Official Site", "hosted version"];
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
      expect(text.network.enableAndRetry).not.toBe("");
      expect(text.settings.label).not.toBe("");
      expect(text.settings.networkOn).not.toBe("");
      expect(text.settings.networkOff).not.toBe("");
      expect(text.settings.changeHint).not.toBe("");
      expect(text.recommendationsTitle).not.toBe("");
      expect(text.recommendations.high).not.toBe("");
      expect(text.recommendations.medium).not.toBe("");
      expect(text.recommendations.low).not.toBe("");
      expect(text.recommendations.incomplete).not.toBe("");
      expect(text.recommendations.limitation).not.toBe("");
      expect(text.recommendations.limitationNetwork).not.toBe("");
      expect(text.recommendations.limitationNetworkFailed).not.toBe("");
      expect(text.fix.hint).not.toBe("");
      expect(text.fix.cta).not.toBe("");
      expect(text.fix.dialogTitle).not.toBe("");
      expect(text.fix.dialogDesc).not.toBe("");
      expect(text.fix.dialogNote).not.toBe("");
      expect(text.fix.dialogProvider).not.toBe("");
      expect(text.fix.dialogConfirm).not.toBe("");
      expect(text.fix.dialogCancel).not.toBe("");
      expect(text.risk.unknown).not.toBe("");
      expect(text.report.title).not.toBe("");
      expect(text.report.copy).not.toBe("");
      expect(text.report.download).not.toBe("");
      expect(text.report.context).not.toBe("");
    }
  });

  it("ships WebRTC and egress copy for every locale", () => {
    for (const text of Object.values(detectorLocaleText)) {
      for (const key of ["webrtc", "exitConsistency", "ipv6Leak", "ipTimezone"]) {
        expect(text.signalLabels[key]).toBeTruthy();
      }
      for (const key of ["webrtcUnsupported", "webrtcTimeout", "webrtcError", "webrtcNoPublic", "webrtcNoCompare", "webrtcMatch", "webrtcMismatch", "exitMatch", "exitMismatch", "exitUnknown", "ipv6None", "ipv6Same", "ipv6Diff", "ipv6Separate", "ipv6Unknown", "ipTimezoneMatch", "ipTimezoneMismatch"]) {
        expect(text.signalValues[key]).toBeTruthy();
      }
      expect(text.network.toggleHint).toMatch(/STUN/);
      expect(text.recommendations.limitation).toMatch(/STUN/);
    }
  });

  it("ships reachability, IPv6 and IP-type copy for every locale", () => {
    for (const text of Object.values(detectorLocaleText)) {
      for (const key of ["intlFormat", "ipType", "ipv6Egress", "claudeAiReachability", "anthropicSiteReachability", "apiReachability", "anthropicEndpointSummary"]) {
        expect(text.signalLabels[key]).toBeTruthy();
      }
      for (const key of ["latency_low", "latency_medium", "latency_high", "reachabilityTimeout", "reachabilityError", "reachabilityAll", "reachabilityPartial", "reachabilityNone", "ipType_datacenter", "ipType_residential", "ipType_carrier", "ipType_unknown", "ipv6EgressMatch", "ipv6EgressMismatch", "ipv6EgressDifferentFamily", "ipv6EgressTimeout", "ipv6EgressNetwork", "ipv6EgressInvalid"]) {
        expect(text.signalValues[key]).toBeTruthy();
      }
      expect(text.signalValues.reachabilityFastest).toContain("{ms}");
      expect(text.network.toggleHint).toMatch(/STUN/);
      expect(text.network.toggleHint).toMatch(/api\.anthropic\.com/);
      expect(text.network.toggleHint).toMatch(/IPv6/);
    }
  });

  it("links the post-check repair CTA to the documented third-party repository", () => {
    expect(cgClaudeRepoUrl).toBe("https://github.com/LcodeCoder/CG-Claude");
  });
});

describe("default signal configuration", () => {
  it("includes the WebRTC and egress signals behind the network layer", () => {
    const ids = defaultSignals.map((signal) => signal.id);

    expect(ids).toEqual(expect.arrayContaining(["country", "webrtc", "exitConsistency", "ipv6Leak", "ipTimezone", "ipType", "ipv6Egress", "claudeAiReachability", "anthropicSiteReachability", "apiReachability", "anthropicEndpointSummary", "intlFormat"]));
    expect(ids.indexOf("webrtc")).toBeLessThan(ids.indexOf("ipAddress"));
    expect(ids.indexOf("ipv6Egress")).toBeLessThan(ids.indexOf("browserIpLocation"));
  });

  it("weights the WebRTC egress and IP timezone signals", () => {
    const byId = Object.fromEntries(defaultSignals.map((signal) => [signal.id, signal]));

    expect(byId.webrtc).toMatchObject({ weight: 18, source: "network" });
    expect(byId.exitConsistency).toMatchObject({ weight: 0, source: "network" });
    expect(byId.ipv6Leak).toMatchObject({ weight: 0, source: "network" });
    expect(byId.ipTimezone).toMatchObject({ weight: 4, source: "network" });
    expect(byId.ipType).toMatchObject({ weight: 0, source: "network" });
    expect(byId.ipv6Egress).toMatchObject({ weight: 0, source: "network" });
    expect(byId.claudeAiReachability).toMatchObject({ weight: 0, source: "network" });
    expect(byId.anthropicSiteReachability).toMatchObject({ weight: 0, source: "network" });
    expect(byId.apiReachability).toMatchObject({ weight: 0, source: "network" });
    expect(byId.anthropicEndpointSummary).toMatchObject({ weight: 0, source: "network" });
    expect(byId.intlFormat).toMatchObject({ weight: 0, source: "browser" });
    expect(defaultSignals.filter((signal) => signal.weight > 0)).toHaveLength(13);
  });
});

describe("target region options", () => {
  it("keeps Hong Kong on auto detection instead of adding a manual target", () => {
    expect(regions.map((item) => item.code)).toEqual(["auto", "cn", "ru"]);
  });
});

describe("region risk helpers", () => {
  it("matches timezones against the selected region", () => {
    expect(timezoneRisk("Asia/Shanghai", "auto")).toBe(1);
    expect(timezoneRisk("Asia/Shanghai", "cn")).toBe(1);
    expect(timezoneRisk("Europe/Moscow", "ru")).toBe(1);
    expect(timezoneRisk("Europe/Samara", "ru")).toBe(1);
    expect(timezoneRisk("Asia/Kamchatka", "ru")).toBe(1);
    expect(timezoneRisk("Europe/Kaliningrad", "auto")).toBe(1);
    expect(timezoneRisk("Europe/Moscow", "cn")).toBe(0);
    expect(timezoneRisk("Asia/Tehran", "ir")).toBe(1);
    expect(timezoneRisk("Asia/Hong_Kong", "auto")).toBe(0.6);
    expect(timezoneRisk("Asia/Hong_Kong", "hk")).toBe(1);
    expect(timezoneRisk("Asia/Hong_Kong", "ru")).toBe(0);
    expect(timezoneRisk("Asia/Shanghai", "hk")).toBe(0);
    expect(timezoneRisk(null, "auto")).toBe(0);
  });

  it("matches language signals against the selected region", () => {
    expect(languageRisk(["zh-CN"], "cn")).toBe(1);
    expect(languageRisk(["zh-TW"], "auto")).toBe(0.5);
    expect(languageRisk(["zh"], "auto")).toBe(0.5);
    expect(languageRisk(["zh-HK"], "hk")).toBe(1);
    expect(languageRisk(["ru-RU"], "ru")).toBe(1);
    expect(languageRisk(["ru-RU"], "cn")).toBe(0);
    expect(languageRisk(["fa-IR"], "ir")).toBe(1);
    expect(languageRisk(["en-US"], "auto")).toBe(0);
  });

  it("matches Intl locale against the selected region", () => {
    expect(localeRisk("zh-CN", "cn")).toBe(1);
    expect(localeRisk("zh-HK", "auto")).toBe(0.5);
    expect(localeRisk("zh", "auto")).toBe(0.5);
    expect(localeRisk("zh-HK", "hk")).toBe(1);
    expect(localeRisk("ru-RU", "ru")).toBe(1);
    expect(localeRisk("ru-RU", "cn")).toBe(0);
    expect(localeRisk("fa-IR", "ir")).toBe(1);
    expect(localeRisk("en-US", "auto")).toBe(0);
    expect(localeRisk(null, "auto")).toBe(0);
  });
});

describe("collectBrowserSignals", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function stubCanvas(availableFonts: string[] = []) {
    vi.stubGlobal("document", {
      createElement: () => ({
        getContext: () => ({
          font: "",
          measureText(this: { font: string }) {
            return { width: availableFonts.some((font) => this.font.includes(`"${font}"`)) ? 197 : 10 };
          },
        }),
      }),
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
    // locale shares the language group cap, which language already fills.
    expect(byId.locale.contribution).toBe(0);
    expect(byId.domesticBrowser.contribution).toBe(8);
    expect(byId.domesticDevice.contribution).toBe(0);
    expect(byId.emojiStyle.contribution).toBe(2);
    expect(byId.languageVariant.contribution).toBe(0);
    expect(byId.chineseFonts.contribution).toBe(0);
    expect(byId.timezoneOffset.contribution).toBe(0);
    expect(result.matchedRegion).toBe("ru");
  });

  it("keeps a generic US Windows browser from being attributed to Russia", () => {
    stubCanvas();
    vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(240);
    const result = collectBrowserSignals(
      "auto",
      detectorLocaleText.en,
      detectionConfig,
      { languages: ["en-US"], timezone: "America/New_York", locale: "en-US", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36", platform: "Windows", brands: "Google Chrome" },
    );
    const byId = Object.fromEntries(result.signals.map((item) => [item.id, item]));

    expect(result.matchedRegion).toBeNull();
    expect(byId.emojiStyle.contribution).toBe(0);
    expect(byId.domesticDevice.contribution).toBe(0);
    expect(summarizeSignals(result.signals).score).toBe(0);
  });

  it("scores Yandex on Windows as Russian evidence in auto mode", () => {
    stubCanvas();
    const result = collectBrowserSignals(
      "auto",
      detectorLocaleText.ru,
      detectionConfig,
      { languages: ["ru-RU"], timezone: "Europe/Moscow", locale: "ru-RU", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 YaBrowser/24.1 Chrome/120 Safari/537.36", platform: "Windows", brands: "Yandex" },
    );
    const byId = Object.fromEntries(result.signals.map((item) => [item.id, item]));

    expect(result.matchedRegion).toBe("ru");
    expect(byId.emojiStyle.contribution).toBe(2);
    expect(byId.domesticDevice.contribution).toBe(0);
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
    expect(byId.languageVariant.contribution).toBe(0);
    expect(byId.locale.contribution).toBe(0);
    expect(summarizeSignals(result.signals).score).toBe(48);
  });

  it("identifies a typical Hong Kong browser profile as Hong Kong", () => {
    stubCanvas(["Microsoft JhengHei"]);
    vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(-480);
    const result = collectBrowserSignals(
      "auto",
      detectorLocaleText.en,
      detectionConfig,
      { languages: ["zh-HK", "zh", "en"], timezone: "Asia/Hong_Kong", locale: "zh-HK", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36", platform: "Windows", brands: "Google Chrome" },
    );
    const byId = Object.fromEntries(result.signals.map((item) => [item.id, item]));

    expect(result.matchedRegion).toBe("hk");
    expect(byId.timezone.contribution).toBe(16);
    expect(byId.language.contribution).toBe(10);
    expect(byId.languageVariant.contribution).toBe(10);
    // Microsoft JhengHei ships with Windows, so it is shown but not scored.
    expect(byId.chineseFonts.contribution).toBe(0);
    expect(byId.chineseFonts.value).toContain("Microsoft JhengHei");
    expect(byId.locale.contribution).toBe(0);
    expect(byId.timezoneOffset.contribution).toBe(3);
    expect(byId.emojiStyle.contribution).toBe(2);
    expect(summarizeSignals(result.signals).score).toBe(41);
  });

  it("keeps a simplified-Chinese browser on the mainland profile", () => {
    stubCanvas();
    vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(-480);
    const result = collectBrowserSignals(
      "auto",
      detectorLocaleText.zh,
      detectionConfig,
      { languages: ["zh-CN", "zh"], timezone: "Asia/Hong_Kong", locale: "zh-CN", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36", platform: "Windows", brands: "Google Chrome" },
    );
    const byId = Object.fromEntries(result.signals.map((item) => [item.id, item]));

    expect(result.matchedRegion).toBe("cn");
    expect(byId.timezone.contribution).toBe(16);
    expect(byId.language.contribution).toBe(20);
    expect(byId.locale.contribution).toBe(0);
  });

  it.each([
    ["Windows", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.6778.360 Safari/537.36", "Windows", ["Microsoft YaHei", "SimSun", "SimHei", "Microsoft JhengHei"]],
    ["macOS", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15", "macOS", ["PingFang SC", "Hiragino Sans GB", "STHeiti", "PingFang TC"]],
  ])("does not score the Chinese fonts bundled with a US %s install", (_os, userAgent, platform, fonts) => {
    stubCanvas(fonts);
    vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(240);
    const result = collectBrowserSignals("auto", detectorLocaleText.en, detectionConfig, { languages: ["en-US"], timezone: "America/New_York", locale: "en-US", userAgent, platform, brands: "Google Chrome" });
    const byId = Object.fromEntries(result.signals.map((item) => [item.id, item]));

    expect(byId.chineseFonts.contribution).toBe(0);
    expect(byId.domesticBrowser.contribution).toBe(0);
    expect(result.matchedRegion).toBeNull();
    expect(summarizeSignals(result.signals).score).toBe(0);
  });

  it("scores Chinese fonts that need a separate install", () => {
    stubCanvas(["Microsoft YaHei", "Source Han Sans SC", "MiSans", "HarmonyOS Sans"]);
    const result = collectBrowserSignals("cn", detectorLocaleText.zh, detectionConfig, { languages: ["en-US"], timezone: "America/New_York", locale: "en-US", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120", platform: "Windows", brands: "Google Chrome" });
    const byId = Object.fromEntries(result.signals.map((item) => [item.id, item]));

    expect(byId.chineseFonts.contribution).toBe(16);
    // vendorFonts shares the font group cap with chineseFonts.
    expect(byId.vendorFonts.contribution).toBe(0);
  });

  it("caps correlated signals at the group's largest weight", () => {
    stubCanvas();
    vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(-480);
    const result = collectBrowserSignals("cn", detectorLocaleText.zh, detectionConfig, { languages: ["zh-CN"], timezone: "Asia/Shanghai", locale: "zh-CN", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120", platform: "Windows", brands: "Google Chrome" });
    const byId = Object.fromEntries(result.signals.map((item) => [item.id, item]));

    expect(byId.timezone.contribution + byId.timezoneOffset.contribution).toBe(26);
    expect(byId.language.contribution + byId.languageVariant.contribution + byId.locale.contribution).toBe(20);
  });

  it("keeps the maximum possible browser score at or below 100", () => {
    const caps = new Map<string, number>();
    let total = 0;
    for (const item of Object.values(detectionConfig.signals)) {
      if (!item.enabled || item.weight <= 0 || item.source !== "browser") continue;
      if (!item.group) total += item.weight;
      else caps.set(item.group, Math.max(caps.get(item.group) ?? 0, item.weight));
    }
    total += [...caps.values()].reduce((sum, value) => sum + value, 0);
    expect(total).toBeLessThanOrEqual(100);
  });

  it("collects date and number formatting as a context signal", () => {
    stubCanvas();
    const result = collectBrowserSignals(
      "auto",
      detectorLocaleText.en,
      detectionConfig,
      { languages: ["en-US"], timezone: "America/New_York", locale: "en-US", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36", platform: "Windows", brands: "Google Chrome" },
    );
    const intlFormat = result.signals.find((signal) => signal.id === "intlFormat");

    expect(intlFormat).toMatchObject({ weight: 0, evaluated: true });
    expect(intlFormat?.value).toContain("·");
  });
});
