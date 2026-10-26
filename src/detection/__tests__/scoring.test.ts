import { describe, expect, it } from "vitest";
import { countryRisk, evaluateAccess } from "../scoring";

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

describe("evaluateAccess", () => {
  it("matches a Hong Kong browser profile instead of mainland China", () => {
    const result = evaluateAccess({
      region: "auto",
      timezone: "Asia/Hong_Kong",
      languages: ["zh-HK", "zh", "en"],
      locale: "zh-HK",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
      source: "browser",
    });

    expect(result.matchedRegion).toBe("hk");
  });

  it("prefers mainland China when language and locale are simplified", () => {
    const result = evaluateAccess({
      region: "auto",
      timezone: "Asia/Hong_Kong",
      languages: ["zh-CN"],
      locale: "zh-CN",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36",
      source: "browser",
    });

    expect(result.matchedRegion).toBe("cn");
  });
});
