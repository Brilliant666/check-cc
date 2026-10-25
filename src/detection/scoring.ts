// CheckCC 的风险评分规则，用于根据地区画像和浏览器信号计算 Claude 产品访问状态与风险分数。
import { REGION_PROFILES } from "../regions";
import type { AccessStatus, ProductAccess, RegionCode, RegionProfile, SignalResult } from "./types";

type Input = {
  region: RegionCode;
  country?: string | null;
  timezone?: string | null;
  languages?: string[];
  locale?: string | null;
  userAgent?: string | null;
  source: "browser" | "server";
};

const UNKNOWN_PRODUCTS: ProductAccess = {
  web: "unknown",
  pro: "unknown",
  api: "unknown",
  payment: "unknown",
};

function includesLower(list: string[], value: string) {
  const v = value.toLowerCase();
  return list.some((item) => v.includes(item.toLowerCase()) || item.toLowerCase().includes(v));
}

function scoreProfile(profile: RegionProfile, input: Input) {
  const ua = (input.userAgent ?? "").toLowerCase();
  const langs = input.languages?.map((lang) => lang.toLowerCase()) ?? [];
  const countryScore = input.country && profile.countries.includes(input.country.toUpperCase()) ? 1 : 0;
  const timezoneScore = input.timezone && profile.timezones.includes(input.timezone) ? 1 : 0;
  const languageScore = langs.some((lang) => includesLower(profile.languages, lang)) ? 1 : 0;
  const localeScore = input.locale && includesLower(profile.languages, input.locale) ? 1 : 0;
  const browserScore = profile.browserPatterns.some((pattern) => ua.includes(pattern)) ? 1 : 0;
  const deviceScore = profile.devicePatterns.some((pattern) => ua.includes(pattern)) ? 0.7 : 0;

  const signals: SignalResult[] = [
    { id: "country", label: "country", value: input.country ?? null, score: countryScore, weight: profile.weights.country, contribution: Math.round(countryScore * profile.weights.country), source: input.source },
    { id: "timezone", label: "timezone", value: input.timezone ?? null, score: timezoneScore, weight: profile.weights.timezone, contribution: Math.round(timezoneScore * profile.weights.timezone), source: input.source },
    { id: "language", label: "language", value: langs.join(", ") || null, score: languageScore, weight: profile.weights.language, contribution: Math.round(languageScore * profile.weights.language), source: input.source },
    { id: "locale", label: "locale", value: input.locale ?? null, score: localeScore, weight: profile.weights.locale, contribution: Math.round(localeScore * profile.weights.locale), source: input.source },
    { id: "browser", label: "browser", value: input.userAgent ? "read" : null, score: browserScore, weight: profile.weights.browser, contribution: Math.round(browserScore * profile.weights.browser), source: input.source },
    { id: "device", label: "device", value: input.userAgent ? "read" : null, score: deviceScore, weight: profile.weights.device, contribution: Math.round(deviceScore * profile.weights.device), source: input.source },
  ].filter((signal) => signal.weight > 0);

  const total = signals.reduce((sum, signal) => sum + signal.contribution, 0);
  return { profile, score: Math.min(100, total), signals };
}

export function countryRisk(countryCode: string | null | undefined, region: RegionCode): { score: number; matchedRegion: Exclude<RegionCode, "auto"> | null } {
  const code = countryCode?.trim().toUpperCase();
  if (!code) return { score: 0, matchedRegion: null };
  const candidates = region === "auto" ? REGION_PROFILES : REGION_PROFILES.filter((profile) => profile.code === region);
  const profile = candidates.find((item) => item.countries.includes(code)) ?? null;
  return { score: profile ? 1 : 0, matchedRegion: profile?.code ?? null };
}

export function accessStatus(score: number): AccessStatus {
  if (score >= 70) return "restricted";
  if (score >= 40) return "possibly_supported";
  if (score > 0) return "unknown";
  return "unknown";
}

export function recommendations(score: number, profile: RegionProfile | null) {
  const items: string[] = [];
  if (score >= 70) {
    items.push("命中多项高风险环境信号。若当前环境与账号常用地区不一致，建议先停止在该环境登录或订阅，核对一致后再使用。");
  } else if (score >= 31) {
    items.push("存在部分地区相关信号。建议核对浏览器语言、系统时区与账号资料是否一致，并避免频繁切换网络环境。");
  } else {
    items.push("未发现明显的高风险组合，但结果不代表账号一定安全；平台风控还会参考登录行为和支付信息。");
  }
  if (profile) {
    items.push(`当前画像与「${profile.name}」特征存在重合；Claude 的支持地区和风控政策可能变化，请以官方说明为准。`);
  }
  items.push("不要通过代理、伪造时区或修改语言来规避地区限制；环境与账号资料不一致可能增加风险。");
  items.push("检测仅基于浏览器端信号，不代表 Anthropic 的实际风控结论。");
  return items;
}

export function evaluateAccess(input: Input) {
  const candidates = input.region === "auto" ? REGION_PROFILES : REGION_PROFILES.filter((profile) => profile.code === input.region);
  const scored = candidates.map((profile) => scoreProfile(profile, input)).sort((a, b) => b.score - a.score);
  const best = scored[0] ?? null;
  const matched = best && best.score > 0 ? best : null;
  const score = matched?.score ?? 0;
  const profile = matched?.profile ?? null;
  return {
    matchedRegion: profile?.code ?? null,
    score,
    status: accessStatus(score),
    products: profile?.products ?? UNKNOWN_PRODUCTS,
    signals: matched?.signals ?? [],
    recommendations: recommendations(score, profile),
  };
}
