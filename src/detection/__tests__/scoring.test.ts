import { describe, expect, it } from "vitest";
import { countryRisk } from "../scoring";

describe("countryRisk", () => {
  it.each([
    ["auto", "CN", 1, "cn"],
    ["auto", "RU", 1, "ru"],
    ["auto", "IR", 1, "ir"],
    ["auto", "US", 0, null],
    ["auto", "HK", 0, null],
    ["cn", "CN", 1, "cn"],
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
