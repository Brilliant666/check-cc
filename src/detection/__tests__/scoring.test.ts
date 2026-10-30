import { describe, expect, it } from "vitest";
import { countryRisk, matchRegion, matchToken, riskLevel, RISK_THRESHOLDS } from "../scoring";

const weights = { timezone: 26, language: 20, locale: 6, browser: 8, device: 6 };

describe("countryRisk", () => {
  it.each([
    ["auto", "CN", 1, "cn"],
    ["auto", "HK", 1, "hk"],
    ["auto", "RU", 1, "ru"],
    ["auto", "IR", 1, "ir"],
    ["auto", "US", 0, null],
    ["cn", "CN", 1, "cn"],
    ["cn", "HK", 0, null],
    ["cn", "RU", 0, null],
    ["ru", "RU", 1, "ru"],
    ["ru", "CN", 0, null],
  ] as Array<[string, string, number, string | null]>)("scores %s + %s as %i", (region, country, score, matchedRegion) => {
    expect(countryRisk(country, region as Parameters<typeof countryRisk>[1])).toEqual({ score, matchedRegion });
  });

  it("normalizes lowercase country codes", () => {
    expect(countryRisk("cn", "auto")).toEqual({ score: 1, matchedRegion: "cn" });
  });

  it("returns no match when the country is missing", () => {
    expect(countryRisk(null, "auto")).toEqual({ score: 0, matchedRegion: null });
    expect(countryRisk("", "cn")).toEqual({ score: 0, matchedRegion: null });
  });
});

describe("matchRegion", () => {
  it("matches a Hong Kong browser profile instead of mainland China", () => {
    const result = matchRegion({
      region: "auto",
      timezone: "Asia/Hong_Kong",
      languages: ["zh-HK", "zh", "en"],
      locale: "zh-HK",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
      weights,
    });

    expect(result).toBe("hk");
  });

  it("prefers mainland China when language and locale are simplified", () => {
    const result = matchRegion({
      region: "auto",
      timezone: "Asia/Hong_Kong",
      languages: ["zh-CN"],
      locale: "zh-CN",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
      weights,
    });

    expect(result).toBe("cn");
  });

  it("uses the same language rules as the scored signals, so a bare zh still points to mainland China", () => {
    expect(matchRegion({ region: "auto", timezone: null, languages: ["zh"], locale: null, userAgent: "", weights })).toBe("cn");
  });

  it("does not match a region from a Chrome build number containing 360", () => {
    expect(matchRegion({ region: "auto", timezone: "America/New_York", languages: ["en-US"], locale: "en-US", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.6778.360 Safari/537.36", weights })).toBeNull();
  });
});

describe("matchToken", () => {
  it("matches whole tokens only", () => {
    expect(matchToken("Mozilla/5.0 Chrome/131.0.6778.360 Safari/537.36", ["360se"])).toBeNull();
    expect(matchToken("Mozilla/5.0 Chrome/120 360SE", ["360se"])).toBe("360se");
    expect(matchToken("ASUS VivoBook", ["vivo"])).toBeNull();
    expect(matchToken("Mozilla/5.0 (Linux; Android 14; vivo X100)", ["vivo"])).toBe("vivo");
    expect(matchToken("Mozilla/5.0 Quark/7.0", ["quark"])).toBe("quark");
    expect(matchToken("Yandex", ["yandex"])).toBe("yandex");
  });
});

describe("riskLevel", () => {
  it("uses one set of thresholds", () => {
    expect(RISK_THRESHOLDS).toEqual({ high: 70, medium: 31 });
    expect(riskLevel(0)).toBe("none");
    expect(riskLevel(1)).toBe("low");
    expect(riskLevel(30)).toBe("low");
    expect(riskLevel(31)).toBe("medium");
    expect(riskLevel(69)).toBe("medium");
    expect(riskLevel(70)).toBe("high");
  });
});
