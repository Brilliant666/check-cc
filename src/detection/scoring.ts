// CheckCC 的地区风险规则，用于判断时区、语言、国家与浏览器特征和各地区画像的重合程度，并统一风险分档。
import { getRegionProfile, REGION_PROFILES } from "../regions";
import type { RegionCode, RegionProfile } from "./types";

type ConcreteRegion = Exclude<RegionCode, "auto">;

export type RiskLevel = "high" | "medium" | "low" | "none";

// 页面、报告和建议统一使用这组阈值。
export const RISK_THRESHOLDS = { high: 70, medium: 31 } as const;

export function riskLevel(score: number): RiskLevel {
  if (score >= RISK_THRESHOLDS.high) return "high";
  if (score >= RISK_THRESHOLDS.medium) return "medium";
  if (score > 0) return "low";
  return "none";
}

export function timezoneRisk(timezone: string | null, region: RegionCode) {
  if (!timezone) return 0;
  if (region === "hk") return getRegionProfile("hk")?.timezones.includes(timezone) ? 1 : 0;
  // Hong Kong has its own profile, so its timezone stays a weaker signal under auto/CN scoring.
  if (region === "auto" ? REGION_PROFILES.some((profile) => profile.code !== "hk" && profile.timezones.includes(timezone)) : Boolean(getRegionProfile(region)?.timezones.includes(timezone))) return 1;
  if ((region === "auto" || region === "cn") && ["Asia/Hong_Kong", "Asia/Macau", "Asia/Taipei"].includes(timezone)) return 0.6;
  return 0;
}

export function languageRisk(languages: string[], region: RegionCode) {
  const values = languages.map((lang) => lang.toLowerCase());
  const matches = (prefix: string) => values.some((lang) => lang === prefix || lang.startsWith(`${prefix}-`));
  if (region === "hk" && values.some((lang) => /^zh-(hk|mo)|zh-hant|^yue/.test(lang))) return 1;
  if (region === "auto" || region === "cn") {
    if (values.some((lang) => /^zh-cn|zh-sg|zh-hans/.test(lang))) return 1;
    if (values.some((lang) => /^zh/.test(lang))) return 0.5;
  }
  if ((region === "auto" || region === "ru") && matches("ru")) return 1;
  if ((region === "auto" || region === "ir") && matches("fa")) return 1;
  return 0;
}

export function localeRisk(locale: string | null, region: RegionCode) {
  if (!locale) return 0;
  const value = locale.toLowerCase();
  const matches = (prefix: string) => value === prefix || value.startsWith(`${prefix}-`);
  if (region === "hk" && /zh-(hk|mo)|zh-hant|^yue/.test(value)) return 1;
  if (region === "auto" || region === "cn") {
    if (/zh-cn|zh-sg|zh-hans/.test(value)) return 1;
    if (/^zh/.test(value)) return 0.5;
  }
  if ((region === "auto" || region === "ru") && matches("ru")) return 1;
  if ((region === "auto" || region === "ir") && matches("fa")) return 1;
  return 0;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 按完整 token 匹配，避免 "360" 命中版本号、"vivo" 命中其他单词之类的子串误报。
export function matchToken(value: string, patterns: string[]) {
  const lower = value.toLowerCase();
  return patterns.find((pattern) => new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(pattern.toLowerCase())}(?=$|[^a-z0-9])`).test(lower)) ?? null;
}

export function countryRisk(countryCode: string | null | undefined, region: RegionCode): { score: number; matchedRegion: ConcreteRegion | null } {
  const code = countryCode?.trim().toUpperCase();
  if (!code) return { score: 0, matchedRegion: null };
  const candidates = region === "auto" ? REGION_PROFILES : REGION_PROFILES.filter((profile) => profile.code === region);
  const profile = candidates.find((item) => item.countries.includes(code)) ?? null;
  return { score: profile ? 1 : 0, matchedRegion: profile?.code ?? null };
}

export type RegionMatchInput = {
  region: RegionCode;
  timezone: string | null;
  languages: string[];
  locale: string | null;
  userAgent: string;
  brands?: string;
  platform?: string;
  weights: { timezone: number; language: number; locale: number; browser: number; device: number };
};

// 只用于挑选最接近的地区画像；评分本身统一由信号权重计算。
function profileOverlap(profile: RegionProfile, input: RegionMatchInput) {
  const { weights } = input;
  const browserProbe = `${input.userAgent} ${input.brands ?? ""}`;
  const deviceProbe = `${input.userAgent} ${input.platform ?? ""}`;
  return (
    timezoneRisk(input.timezone, profile.code) * weights.timezone +
    languageRisk(input.languages, profile.code) * weights.language +
    localeRisk(input.locale, profile.code) * weights.locale +
    (matchToken(browserProbe, profile.browserPatterns) ? weights.browser : 0) +
    (matchToken(deviceProbe, profile.devicePatterns) ? weights.device : 0)
  );
}

export function matchRegion(input: RegionMatchInput): ConcreteRegion | null {
  const candidates = input.region === "auto" ? REGION_PROFILES : REGION_PROFILES.filter((profile) => profile.code === input.region);
  let best: { code: ConcreteRegion; score: number } | null = null;
  for (const profile of candidates) {
    const score = profileOverlap(profile, input);
    if (score > 0 && (!best || score > best.score)) best = { code: profile.code, score };
  }
  return best?.code ?? null;
}
