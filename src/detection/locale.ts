// CheckCC 的检测模块本地化工具，用于定义检测文案结构并按语言展示地区和信号值。
import type { LocaleCode } from "@/i18n/messages";
import type { RegionCode } from "./types";

export type TargetRegion = RegionCode | "hk";

export type DetectorLocaleText = {
  pending: string;
  unknown: string;
  signalLabels: Record<string, string>;
  signalValues: Record<string, string>;
  ipMetricLabels: Record<string, string>;
  regions: Record<TargetRegion, string>;
  status: Record<string, string>;
  risk: { waiting: string; checking: string; supported: string; blocked: string; high: string; light: string; unknown: string };
  valueMap: Record<string, string>;
  confidence: { high: string; medium: string; low: string; safe: string; highRiskRegion: string; supportedRegion: string };
  notEvaluated: string;
  coverageLabel: string;
  coverageInsufficient: string;
  browserOnlyNote: string;
  recommendationsTitle: string;
  recommendations: { high: string; medium: string; low: string; incomplete: string; limitation: string };
};

export function localizeLocation(value: string, locale: LocaleCode) {
  if (locale !== "ru") return value;
  return value.replace(/日本/g, "Япония").replace(/东京都/g, "Токио").replace(/东京/g, "Токио").replace(/中国大陆/g, "материковый Китай").replace(/中国/g, "Китай");
}

export const detectorLocaleText: Record<LocaleCode, DetectorLocaleText> = {
  zh: {
    pending: "等待检测",
    unknown: "未知",
    signalLabels: { timezone: "系统时区", language: "浏览器语言", languageVariant: "语言文字特征", chineseFonts: "字体地区特征", vendorFonts: "厂商字体异常", domesticBrowser: "浏览器地区特征", domesticDevice: "设备地区特征", locale: "Intl 区域设置", timezoneOffset: "时区偏移", emojiStyle: "Emoji 渲染风格", country: "网络出口", proxyCountry: "代理出口国家", ipAddress: "IP 地址", os: "操作系统", browserIpLocation: "IP 位置", browserIpAsn: "ASN", browserIpOrg: "网络组织", browser: "浏览器/应用环境", device: "设备/系统线索", ipCountryRisk: "IP 风险国家", claudeAccessRisk: "Claude 访问风险" },
    signalValues: { unknown: "未知", noBrands: "无 UA-CH brands", noLanguageVariant: "未命中重点语言文字", simplifiedChinese: "中文简体", traditionalChinese: "中文繁体", scFonts: "中国字体", tcFonts: "中文繁体字体", noFonts: "未命中重点地区字体", vendorFonts: "设备厂商字体", noVendorFonts: "未命中设备厂商字体", noDevice: "未命中重点设备特征", unknownBrowser: "未知浏览器", unknownSystem: "未知系统", wechatBrowser: "微信内置浏览器", androidDevice: "Android 设备", linuxDevice: "Linux 设备", appleEmoji: "Apple Emoji 风格", androidEmoji: "Android / 厂商 Emoji 风格", windowsEmoji: "Windows Emoji 风格", unknownEmoji: "未知 Emoji 风格", read: "已读取" },
    ipMetricLabels: { ipAddress: "IP 地址", ipv6: "IPv6", ipv4: "IPv4", asn: "ASN", asnOwner: "ASN 所有者", company: "企业", longitude: "经度", latitude: "纬度", ipType: "IP 类型", risk: "风控值", isp: "ISP" },
    regions: { auto: "自动检测", cn: "中国大陆", hk: "香港", ru: "俄罗斯", ir: "伊朗" },
    status: { restricted: "高风险 / 可能受限", possibly_supported: "需要进一步确认", unsupported: "不支持", supported: "完美支持", unknown: "未确认" },
    risk: { waiting: "等待检测", checking: "检测中", supported: "完美支持", blocked: "封号风险", high: "高危风险", light: "轻度风险", unknown: "未确认" },
    valueMap: { "中国大陆 IP": "中国大陆 IP", "访问和订阅风险极高": "访问和订阅风险极高" },
    confidence: { high: "高度疑似", medium: "疑似", low: "少量命中", safe: "环境安全，疑似", highRiskRegion: "高风险地区", supportedRegion: "官方支持地区" },
    notEvaluated: "未检测",
    coverageLabel: "可评估信号",
    coverageInsufficient: "可评估信号不足，暂时无法判断地区风险。",
    browserOnlyNote: "当前版本仅分析浏览器端信号，不请求 IP、网络出口或账号数据。",
    recommendationsTitle: "下一步建议",
    recommendations: {
      high: "命中多项高风险信号。若当前环境与账号常用地区不一致，建议先停止在该环境登录或订阅，核对一致后再使用。",
      medium: "存在部分地区相关信号。建议核对浏览器语言、系统时区与账号资料是否一致，并避免频繁切换网络环境。",
      low: "未发现明显的高风险组合，但结果不代表账号一定安全；平台风控还会参考登录行为和支付信息。",
      incomplete: "部分信号无法评估，当前结论可能不完整；可尝试更换主流浏览器重新检测。",
      limitation: "结果仅基于本机浏览器信号，不读取账号或 Cookie，也不请求 IP 与网络出口信息。",
    },
  },
  "zh-HK": {
    pending: "等待檢測",
    unknown: "未知",
    signalLabels: { timezone: "系統時區", language: "瀏覽器語言", languageVariant: "語言文字特徵", chineseFonts: "字體地區特徵", vendorFonts: "廠商字體異常", domesticBrowser: "瀏覽器地區特徵", domesticDevice: "設備地區特徵", locale: "Intl 區域設定", timezoneOffset: "時區偏移", emojiStyle: "Emoji 渲染風格", country: "網絡出口", proxyCountry: "代理出口國家", ipAddress: "IP 地址", os: "作業系統", browserIpLocation: "IP 位置", browserIpAsn: "ASN", browserIpOrg: "網絡組織", browser: "瀏覽器/應用環境", device: "設備/系統線索", ipCountryRisk: "IP 風險國家", claudeAccessRisk: "Claude 訪問風險" },
    signalValues: { unknown: "未知", noBrands: "無 UA-CH brands", noLanguageVariant: "未命中重點語言文字", simplifiedChinese: "中文簡體", traditionalChinese: "中文繁體", scFonts: "中國內地字體", tcFonts: "中文繁體字體", noFonts: "未命中重點地區字體", vendorFonts: "設備廠商字體", noVendorFonts: "未命中設備廠商字體", noDevice: "未命中重點設備特徵", unknownBrowser: "未知瀏覽器", unknownSystem: "未知系統", wechatBrowser: "微信內置瀏覽器", androidDevice: "Android 設備", linuxDevice: "Linux 設備", appleEmoji: "Apple Emoji 風格", androidEmoji: "Android / 廠商 Emoji 風格", windowsEmoji: "Windows Emoji 風格", unknownEmoji: "未知 Emoji 風格", read: "已讀取" },
    ipMetricLabels: { ipAddress: "IP 地址", ipv6: "IPv6", ipv4: "IPv4", asn: "ASN", asnOwner: "ASN 擁有者", company: "企業", longitude: "經度", latitude: "緯度", ipType: "IP 類型", risk: "風控值", isp: "ISP" },
    regions: { auto: "自動檢測", cn: "中國內地", hk: "香港", ru: "俄羅斯", ir: "伊朗" },
    status: { restricted: "高風險 / 可能受限", possibly_supported: "需要進一步確認", unsupported: "不支援", supported: "完美支援", unknown: "未確認" },
    risk: { waiting: "等待檢測", checking: "檢測中", supported: "完美支援", blocked: "封號風險", high: "高危風險", light: "輕度風險", unknown: "未確認" },
    valueMap: { "中国大陆 IP": "中國內地 IP", "访问和订阅风险极高": "訪問和訂閱風險極高" },
    confidence: { high: "高度疑似", medium: "疑似", low: "少量命中", safe: "環境安全，疑似", highRiskRegion: "高風險地區", supportedRegion: "官方支援地區" },
    notEvaluated: "未檢測",
    coverageLabel: "可評估訊號",
    coverageInsufficient: "可評估訊號不足，暫時無法判斷地區風險。",
    browserOnlyNote: "目前版本僅分析瀏覽器端訊號，不請求 IP、網絡出口或帳號資料。",
    recommendationsTitle: "下一步建議",
    recommendations: {
      high: "命中多項高風險訊號。若目前環境與帳號常用地區不一致，建議先停止在該環境登入或訂閱，核對一致後再使用。",
      medium: "存在部分地區相關訊號。建議核對瀏覽器語言、系統時區與帳號資料是否一致，並避免頻繁切換網絡環境。",
      low: "未發現明顯的高風險組合，但結果不代表帳號一定安全；平台風控還會參考登入行為和付款資料。",
      incomplete: "部分訊號無法評估，目前結論可能不完整；可嘗試更換主流瀏覽器重新檢測。",
      limitation: "結果僅基於本機瀏覽器訊號，不讀取帳號或 Cookie，也不請求 IP 與網絡出口資料。",
    },
  },
  ru: {
    pending: "Ожидание проверки",
    unknown: "Неизвестно",
    signalLabels: { timezone: "Часовой пояс", language: "Язык браузера", languageVariant: "Языковые признаки", chineseFonts: "Региональные шрифты", vendorFonts: "Шрифты производителя", domesticBrowser: "Регион браузера", domesticDevice: "Регион устройства", locale: "Intl locale", timezoneOffset: "Смещение времени", emojiStyle: "Стиль Emoji", country: "Сетевой выход", proxyCountry: "Страна прокси", ipAddress: "IP-адрес", os: "ОС", browserIpLocation: "IP-локация", browserIpAsn: "ASN", browserIpOrg: "Сетевая организация", browser: "Браузер/приложение", device: "Устройство/система", ipCountryRisk: "Страна риска IP", claudeAccessRisk: "Риск доступа Claude" },
    signalValues: { unknown: "Неизвестно", noBrands: "Нет UA-CH brands", noLanguageVariant: "Ключевые языковые признаки не найдены", simplifiedChinese: "Упрощенный китайский", traditionalChinese: "Традиционный китайский", scFonts: "Китайские шрифты", tcFonts: "Традиционные китайские шрифты", noFonts: "Ключевые региональные шрифты не найдены", vendorFonts: "Шрифты производителя", noVendorFonts: "Шрифты производителя не найдены", noDevice: "Ключевые признаки устройства не найдены", unknownBrowser: "Неизвестный браузер", unknownSystem: "Неизвестная система", wechatBrowser: "Встроенный браузер WeChat", androidDevice: "Android-устройство", linuxDevice: "Linux-устройство", appleEmoji: "Стиль Apple Emoji", androidEmoji: "Стиль Android / производителя", windowsEmoji: "Стиль Windows Emoji", unknownEmoji: "Неизвестный стиль Emoji", read: "Считано" },
    ipMetricLabels: { ipAddress: "IP-адрес", ipv6: "IPv6", ipv4: "IPv4", asn: "ASN", asnOwner: "Владелец ASN", company: "Компания", longitude: "Долгота", latitude: "Широта", ipType: "Тип IP", risk: "Риск", isp: "ISP" },
    regions: { auto: "Автоопределение", cn: "Китай", hk: "Гонконг", ru: "Россия", ir: "Иран" },
    status: { restricted: "Высокий риск / возможно ограничено", possibly_supported: "Нужно уточнение", unsupported: "Не поддерживается", supported: "Полная поддержка", unknown: "Не подтверждено" },
    risk: { waiting: "Ожидание", checking: "Проверка", supported: "Поддерживается", blocked: "Риск блокировки", high: "Высокий риск", light: "Низкий риск", unknown: "Не подтверждено" },
    valueMap: { "中国大陆 IP": "IP материкового Китая", "访问和订阅风险极高": "Очень высокий риск доступа и подписки" },
    confidence: { high: "Высокая вероятность", medium: "Возможные признаки", low: "Небольшое совпадение", safe: "Среда выглядит безопасной:", highRiskRegion: "регион высокого риска", supportedRegion: "поддерживаемый регион" },
    notEvaluated: "Не проверено",
    coverageLabel: "Оценено сигналов",
    coverageInsufficient: "Недостаточно оцениваемых сигналов для вывода о риске региона.",
    browserOnlyNote: "Текущая версия анализирует только сигналы браузера и не запрашивает IP, сетевой выход или данные аккаунта.",
    recommendationsTitle: "Рекомендации",
    recommendations: {
      high: "Обнаружено несколько сигналов высокого риска. Если среда отличается от обычного региона аккаунта, не входите и не оформляйте подписку до устранения расхождений.",
      medium: "Есть отдельные региональные сигналы. Проверьте согласованность языка браузера, часового пояса и данных аккаунта; избегайте частой смены сети.",
      low: "Явных сочетаний высокого риска не найдено, но это не гарантирует безопасность аккаунта: учитываются также входы и платежные данные.",
      incomplete: "Часть сигналов недоступна, вывод может быть неполным. Повторите проверку в популярном браузере.",
      limitation: "Результат основан только на сигналах браузера; аккаунт и Cookie не читаются, IP и сетевой выход не запрашиваются.",
    },
  },
  en: {
    pending: "Waiting",
    unknown: "Unknown",
    signalLabels: { timezone: "System timezone", language: "Browser language", languageVariant: "Language variant", chineseFonts: "Regional fonts", vendorFonts: "Vendor fonts", domesticBrowser: "Browser region traits", domesticDevice: "Device region traits", locale: "Intl locale", timezoneOffset: "Timezone offset", emojiStyle: "Emoji rendering style", country: "Network exit", proxyCountry: "Proxy exit country", ipAddress: "IP address", os: "Operating system", browserIpLocation: "IP location", browserIpAsn: "ASN", browserIpOrg: "Network organization", browser: "Browser/app environment", device: "Device/system signals", ipCountryRisk: "IP risk country", claudeAccessRisk: "Claude access risk" },
    signalValues: { unknown: "Unknown", noBrands: "No UA-CH brands", noLanguageVariant: "No key language variant detected", simplifiedChinese: "Simplified Chinese", traditionalChinese: "Traditional Chinese", scFonts: "Simplified Chinese fonts", tcFonts: "Traditional Chinese fonts", noFonts: "No key regional fonts detected", vendorFonts: "Vendor fonts", noVendorFonts: "No vendor fonts detected", noDevice: "No key device traits detected", unknownBrowser: "Unknown browser", unknownSystem: "Unknown system", wechatBrowser: "WeChat in-app browser", androidDevice: "Android device", linuxDevice: "Linux device", appleEmoji: "Apple Emoji style", androidEmoji: "Android / vendor Emoji style", windowsEmoji: "Windows Emoji style", unknownEmoji: "Unknown Emoji style", read: "Read" },
    ipMetricLabels: { ipAddress: "IP address", ipv6: "IPv6", ipv4: "IPv4", asn: "ASN", asnOwner: "ASN owner", company: "Company", longitude: "Longitude", latitude: "Latitude", ipType: "IP type", risk: "Risk score", isp: "ISP" },
    regions: { auto: "Auto detect", cn: "Mainland China", hk: "Hong Kong", ru: "Russia", ir: "Iran" },
    status: { restricted: "High risk / possibly restricted", possibly_supported: "Needs confirmation", unsupported: "Unsupported", supported: "Fully supported", unknown: "Unconfirmed" },
    risk: { waiting: "Waiting", checking: "Checking", supported: "Fully supported", blocked: "Account risk", high: "High risk", light: "Light risk", unknown: "Unconfirmed" },
    valueMap: { "中国大陆 IP": "Mainland China IP", "访问和订阅风险极高": "Very high access and subscription risk" },
    confidence: { high: "Highly likely", medium: "Likely", low: "Lightly matched", safe: "Environment looks safe, likely", highRiskRegion: "high-risk region", supportedRegion: "officially supported region" },
    notEvaluated: "Not evaluated",
    coverageLabel: "Evaluated signals",
    coverageInsufficient: "Not enough evaluable signals to determine regional risk.",
    browserOnlyNote: "This version analyzes browser-side signals only. It does not request IP, network egress, or account data.",
    recommendationsTitle: "Next steps",
    recommendations: {
      high: "Multiple high-risk signals matched. If this environment differs from your account's usual region, avoid signing in or subscribing here until the mismatch is resolved.",
      medium: "Some region-related signals matched. Check that browser language, system timezone, and account details are consistent, and avoid frequent network switching.",
      low: "No clear high-risk combination was found, but this does not guarantee account safety; platform risk controls also consider sign-in behavior and payment details.",
      incomplete: "Some signals could not be evaluated, so the conclusion may be incomplete. Try again in a mainstream browser.",
      limitation: "The result uses browser-side signals only. It does not read your account or cookies, and does not request IP or network egress data.",
    },
  },
};
