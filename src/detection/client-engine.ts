// CheckCC 的浏览器检测核心工具，用于采集环境信号、生成展示数据并计算前端风险结果。
import { getRegionProfile, REGION_PROFILES } from "../regions";
import { languageRisk, localeRisk, matchRegion, matchToken, timezoneRisk } from "./scoring";
import { detectionConfig, getSignalConfig, getSignalWeight, type DetectionConfig } from "./config";
import type { DetectorLocaleText } from "./locale";
import type { RegionCode, SignalResult } from "./types";

export type SignalView = SignalResult & { state?: "pending" | "running" | "done" | "unknown" | "unavailable" };
export type BrowserEnvironmentSnapshot = {
  languages: string[];
  timezone: string | null;
  locale: string | null;
  userAgent: string;
  platform?: string;
  brands: string;
};

export const regions: Array<{ code: RegionCode }> = [{ code: "auto" }, { code: "cn" }, { code: "ru" }];

export { languageRisk, localeRisk, timezoneRisk } from "./scoring";

export const scanSteps = detectionConfig.steps;

const webRtcSignalIds = new Set(["webrtc", "exitConsistency", "ipv6Leak"]);

export const defaultSignals: SignalView[] = Object.entries(detectionConfig.signals)
  .filter(([id, config]) => {
    if (!config.enabled) return false;
    if (config.source !== "server" && config.source !== "network") return true;
    if (!detectionConfig.services.ipIntel?.enabled) return false;
    return !webRtcSignalIds.has(id) || Boolean(detectionConfig.services.webrtc?.enabled);
  })
  .sort(([, a], [, b]) => a.order - b.order)
  .map(([id, config]) => ({ id, label: config.labelKey, value: null, score: 0, weight: config.weight, contribution: 0, source: config.source, evaluated: false }));

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function animateProgress(from: number, to: number, setProgress: (value: number) => void, setActiveSignal: (value: number) => void) {
  const frames = 4;
  for (let i = 1; i <= frames; i += 1) {
    const value = Math.round(from + ((to - from) * i) / frames);
    setProgress(value);
    setActiveSignal(Math.min(defaultSignals.length - 1, Math.floor((value / 100) * defaultSignals.length)));
    await sleep(22);
  }
}

function makeSignal(id: string, label: string, value: string | null, fallbackWeight: number, matched: boolean, text: DetectorLocaleText, config: DetectionConfig): SignalResult {
  return makeSignalScore(id, label, value, fallbackWeight, matched ? 1 : 0, text, config);
}

export function makeSignalScore(id: string, label: string, value: string | null, fallbackWeight: number, score: number, text: DetectorLocaleText, config: DetectionConfig): SignalResult {
  const normalized = Math.max(0, Math.min(1, score));
  const weight = getSignalWeight(id, fallbackWeight, config);
  const hasValue = value !== null && value !== "";
  return { id, label, value: value || text.unknown, score: normalized, weight, contribution: Math.round(normalized * weight), source: getSignalConfig(id, config)?.source ?? "browser", evaluated: hasValue };
}

function hasFont(font: string) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  const text = "\u4e2d\u6587\u5b57\u4f53\u68c0\u6d4bABCabc012";
  return ["monospace", "sans-serif", "serif"].some((base) => {
    ctx.font = `72px ${base}`;
    const baseWidth = ctx.measureText(text).width;
    ctx.font = `72px \"${font}\", ${base}`;
    return Math.abs(ctx.measureText(text).width - baseWidth) > 0.5;
  });
}

// Windows、macOS/iOS 和主流 Linux 发行版默认自带这些中文字体，与系统语言和所在地区无关，只作为上下文展示。
const BUNDLED_CJK_FONTS = ["Microsoft YaHei", "SimSun", "SimHei", "Microsoft JhengHei", "MingLiU", "PMingLiU", "PingFang SC", "PingFang HK", "PingFang TC", "Hiragino Sans GB", "Hiragino Sans CNS", "STHeiti", "STSong", "Heiti TC", "Noto Sans CJK SC", "Noto Sans CJK HK", "Noto Sans CJK TC"];
// 需要用户或厂商额外安装的中文字体，命中时才计分。
const INSTALLED_SC_FONTS = ["Source Han Sans SC", "WenQuanYi Micro Hei"];
const INSTALLED_TC_FONTS = ["Source Han Sans TC"];
const VENDOR_FONTS = ["MiSans", "HarmonyOS Sans", "OPPO Sans", "vivo Sans", "Honor Sans", "Alibaba PuHuiTi", "WPS Fangzheng", "FZLanTingHeiS"];

export function localizeSignalValue(value: string | null, text: DetectorLocaleText) {
  if (!value) return value;
  return text.valueMap[value] ?? value;
}

function detectBrowserName(ua: string, text: DetectorLocaleText) {
  if (/Edg\//.test(ua)) return "Microsoft Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/YaBrowser/i.test(ua)) return "Yandex Browser";
  if (/Chrome\//.test(ua) && !/Chromium/.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  if (/MicroMessenger/i.test(ua)) return text.signalValues.wechatBrowser;
  return text.signalValues.unknownBrowser;
}

function detectOS(ua: string, platform: string | undefined, text: DetectorLocaleText) {
  const probe = `${ua} ${platform ?? ""}`;
  if (/harmonyos/i.test(probe)) return "HarmonyOS";
  if (/android/i.test(probe)) return "Android";
  if (/iphone|ipad|ios/i.test(probe)) return "iOS";
  if (/mac os|macintosh|macintel/i.test(probe)) return "macOS";
  if (/windows nt/i.test(probe)) return "Windows";
  if (/linux/i.test(probe)) return "Linux";
  return platform || text.signalValues.unknownSystem;
}

function detectDeviceName(ua: string, platform: string | undefined, text: DetectorLocaleText) {
  const os = detectOS(ua, platform, text);
  if (/iphone/i.test(ua)) return `iPhone / ${os}`;
  if (/ipad/i.test(ua)) return `iPad / ${os}`;
  if (/android/i.test(ua)) return `${text.signalValues.androidDevice} / ${os}`;
  if (/macintosh|mac os|macintel/i.test(`${ua} ${platform ?? ""}`)) return `Mac / ${os}`;
  if (/windows/i.test(ua)) return `Windows PC / ${os}`;
  if (/linux/i.test(ua)) return `${text.signalValues.linuxDevice} / ${os}`;
  return os;
}

function detectIntlFormat() {
  try {
    const sample = new Date(Date.UTC(2026, 9, 30, 13, 45));
    const date = new Intl.DateTimeFormat(undefined, { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" }).format(sample);
    const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(sample);
    const number = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(1234.5);
    return `${date} · ${time} · ${number}`;
  } catch {
    return null;
  }
}

export function collectBrowserEnvironment(text: DetectorLocaleText): BrowserEnvironmentSnapshot {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string; brands?: Array<{ brand: string; version: string }>; mobile?: boolean } };
  return {
    languages: navigator.languages?.length ? [...navigator.languages] : [navigator.language].filter(Boolean),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    locale: Intl.DateTimeFormat().resolvedOptions().locale || null,
    userAgent: navigator.userAgent,
    platform: nav.userAgentData?.platform,
    brands: nav.userAgentData?.brands?.map((item) => item.brand).join(" / ") || text.signalValues.noBrands,
  };
}

export function collectBrowserSignals(region: RegionCode, text: DetectorLocaleText, config: DetectionConfig = detectionConfig, snapshot = collectBrowserEnvironment(text)) {
  const { languages, timezone, locale, userAgent: ua, platform, brands } = snapshot;
  const chineseTarget = region === "auto" || region === "cn" || region === "hk";
  const profile = getRegionProfile(region);
  const browserPatterns = region === "auto" ? Array.from(new Set(REGION_PROFILES.flatMap((item) => item.browserPatterns))) : profile?.browserPatterns ?? [];
  const devicePatterns = chineseTarget ? getRegionProfile("cn")?.devicePatterns ?? [] : profile?.devicePatterns ?? [];
  const bundledFonts = BUNDLED_CJK_FONTS.filter(hasFont);
  const scFonts = INSTALLED_SC_FONTS.filter(hasFont);
  const tcFonts = INSTALLED_TC_FONTS.filter(hasFont);
  const vendorFonts = VENDOR_FONTS.filter(hasFont);
  const browserTrait = matchToken(`${ua} ${brands}`, browserPatterns);
  const deviceTrait = matchToken(`${ua} ${platform ?? ""}`, devicePatterns);
  const chineseVariant = languages.some((lang) => /zh-(tw|hk|mo)|zh-hant/i.test(lang)) ? text.signalValues.traditionalChinese : languages.some((lang) => /zh-cn|zh-sg|zh-hans|zh/i.test(lang)) ? text.signalValues.simplifiedChinese : null;
  const offset = -new Date().getTimezoneOffset() / 60;
  const timezoneScore = timezoneRisk(timezone, region);
  const languageScore = languageRisk(languages, region);
  const localeScore = localeRisk(locale, region);
  const matchedRegion = matchRegion({
    region,
    timezone,
    languages,
    locale,
    userAgent: ua,
    brands,
    platform,
    weights: {
      timezone: getSignalWeight("timezone", 26, config),
      language: getSignalWeight("language", 20, config),
      locale: getSignalWeight("locale", 6, config),
      browser: getSignalWeight("domesticBrowser", 8, config),
      device: getSignalWeight("domesticDevice", 6, config),
    },
  });
  const hasRegionEvidence = region !== "auto" || matchedRegion !== null;
  const languageVariantScore = chineseTarget && chineseVariant ? 1 : 0;
  const fontScore = chineseTarget ? (scFonts.length ? 1 : tcFonts.length ? 0.5 : 0) : 0;
  const vendorFontScore = chineseTarget ? (vendorFonts.length >= 2 ? 1 : vendorFonts.length === 1 ? 0.8 : 0) : 0;
  const deviceScore = deviceTrait ? (chineseTarget ? (deviceTrait === "harmonyos" ? 1 : 0.7) : 0.3) : 0;
  const timezoneOffsetScore = chineseTarget && offset === 8 ? 0.7 : 0;
  const emojiStyle = /iphone|ipad|mac os/i.test(ua) ? text.signalValues.appleEmoji : /android|harmonyos/i.test(ua) ? text.signalValues.androidEmoji : /windows/i.test(ua) ? text.signalValues.windowsEmoji : text.signalValues.unknownEmoji;
  // Emoji rendering only correlates with region when another signal already points to a region.
  const emojiScore = hasRegionEvidence ? (/android|harmonyos|windows/i.test(ua) ? 0.4 : /iphone|ipad|mac os/i.test(ua) ? 0.2 : 0) : 0;
  const label = text.signalLabels;
  const value = text.signalValues;
  const fontValue = [
    scFonts.length ? `${value.scFonts}：${scFonts.join(" / ")}` : tcFonts.length ? `${value.tcFonts}：${tcFonts.join(" / ")}` : value.noFonts,
    bundledFonts.length ? `${value.bundledFonts}：${bundledFonts.join(" / ")}` : null,
  ].filter(Boolean).join(" · ");
  const signals: SignalResult[] = [
    makeSignalScore("timezone", label.timezone, timezone, 26, timezoneScore, text, config),
    makeSignalScore("language", label.language, languages.join(", "), 20, languageScore, text, config),
    makeSignalScore("languageVariant", label.languageVariant, chineseVariant || value.noLanguageVariant, 12, languageVariantScore, text, config),
    makeSignalScore("chineseFonts", label.chineseFonts, fontValue, 16, fontScore, text, config),
    makeSignalScore("vendorFonts", label.vendorFonts, vendorFonts.length ? `${value.vendorFonts}：${vendorFonts.join(" / ")}` : value.noVendorFonts, 10, vendorFontScore, text, config),
    makeSignalScore("domesticBrowser", label.domesticBrowser, browserTrait || detectBrowserName(ua, text), 8, browserTrait ? 1 : 0, text, config),
    makeSignal("browser", label.browser, `${detectBrowserName(ua, text)} / ${detectOS(ua, platform, text)}`, 0, false, text, config),
    makeSignalScore("domesticDevice", label.domesticDevice, deviceTrait || value.noDevice, 6, deviceScore, text, config),
    makeSignal("device", label.device, detectDeviceName(ua, platform, text), 0, false, text, config),
    makeSignal("os", label.os, detectOS(ua, platform, text), 0, false, text, config),
    makeSignalScore("locale", label.locale, locale, 6, localeScore, text, config),
    makeSignal("intlFormat", label.intlFormat, detectIntlFormat(), 0, false, text, config),
    makeSignalScore("timezoneOffset", label.timezoneOffset, `UTC${offset >= 0 ? "+" : ""}${offset}`, 4, timezoneOffsetScore, text, config),
    makeSignalScore("emojiStyle", label.emojiStyle, emojiStyle, 4, emojiScore, text, config),
  ].filter((signal) => getSignalConfig(signal.id, config)?.enabled !== false);
  return { matchedRegion, signals: applySignalGroups(signals, config) };
}

// 同组信号测的是同一件事（例如时区与时区偏移），组内贡献按信号顺序累加，合计不超过组内最大权重。
export function applySignalGroups<T extends SignalResult>(signals: T[], config: DetectionConfig = detectionConfig): T[] {
  const caps = new Map<string, number>();
  for (const item of Object.values(config.signals)) {
    if (item.enabled && item.group) caps.set(item.group, Math.max(caps.get(item.group) ?? 0, item.weight));
  }
  const spent = new Map<string, number>();
  return signals.map((signal) => {
    const group = getSignalConfig(signal.id, config)?.group;
    if (!group || signal.evaluated === false) return signal;
    const used = spent.get(group) ?? 0;
    const contribution = Math.max(0, Math.min(signal.contribution, (caps.get(group) ?? 0) - used));
    spent.set(group, used + contribution);
    return contribution === signal.contribution ? signal : { ...signal, contribution };
  });
}

function isPublicIpv4(ip: string) {
  const parts = ip.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part))) return false;
  const octets = parts.map(Number);
  if (octets.some((part) => part > 255)) return false;
  const [a, b, c] = octets;
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return a < 224;
}

function isPublicIpv6(value: string) {
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/.exec(value);
  if (mapped) return isPublicIpv4(mapped[1]);
  if (value === "::" || value === "::1") return false;
  if (!/^[0-9a-f:]+$/.test(value) || (value.match(/::/g) ?? []).length > 1) return false;
  if (value.startsWith(":") && !value.startsWith("::")) return false;
  if (value.endsWith(":") && !value.endsWith("::")) return false;
  const groups = value.split(":").filter(Boolean);
  if (value.includes("::") ? groups.length > 7 : groups.length !== 8) return false;
  if (groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return false;
  const first = Number.parseInt(groups[0], 16);
  if (first >= 0xfc00) return false;
  if (first === 0x2001 && Number.parseInt(groups[1] ?? "0", 16) === 0x0db8) return false;
  return first >= 0x2000 && first <= 0x3fff;
}

export function isPublicIp(ip: string): boolean {
  const value = ip.trim().toLowerCase().replace(/^\[|\]$/g, "").replace(/%.*$/, "");
  if (!value) return false;
  return value.includes(":") ? isPublicIpv6(value) : isPublicIpv4(value);
}

export type SignalScoreSummary = {
  score: number;
  coverage: number;
  evaluatedCount: number;
  totalCount: number;
  hitCount: number;
};

export function summarizeSignals(signals: SignalResult[]): SignalScoreSummary {
  const weighted = signals.filter((signal) => signal.weight > 0);
  const totalWeight = weighted.reduce((sum, signal) => sum + signal.weight, 0);
  const evaluated = weighted.filter((signal) => signal.evaluated !== false);
  const evaluatedWeight = evaluated.reduce((sum, signal) => sum + signal.weight, 0);
  const raw = evaluated.reduce((sum, signal) => sum + Math.max(0, signal.contribution), 0);
  return {
    score: Math.min(100, Math.round(raw)),
    coverage: totalWeight > 0 ? Math.round((evaluatedWeight / totalWeight) * 100) : 0,
    evaluatedCount: evaluated.length,
    totalCount: weighted.length,
    hitCount: weighted.filter((signal) => signal.evaluated !== false && signal.contribution > 0).length,
  };
}
