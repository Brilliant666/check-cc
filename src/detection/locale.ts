// CheckCC 的检测模块本地化工具，用于定义检测文案结构并按语言展示地区和信号值。
import type { LocaleCode } from "@/i18n/messages";
import type { RegionCode } from "./types";

export type TargetRegion = RegionCode | "hk";

export type DetectorLocaleText = {
  pending: string;
  unknown: string;
  signalLabels: Record<string, string>;
  signalValues: Record<string, string>;
  regions: Record<TargetRegion, string>;
  status: Record<string, string>;
  risk: { waiting: string; checking: string; supported: string; blocked: string; high: string; light: string; unknown: string; scoreLabel: string };
  valueMap: Record<string, string>;
  confidence: { high: string; medium: string; low: string; safe: string };
  notEvaluated: string;
  coverageLabel: string;
  coverageInsufficient: string;
  network: {
    toggleLabel: string;
    toggleHint: string;
    idle: string;
    checking: string;
    success: string;
    failed: string;
    disabled: string;
    unavailable: string;
  };
  settings: { label: string; networkOn: string; networkOff: string; changeHint: string };
  recommendationsTitle: string;
  recommendations: { high: string; medium: string; low: string; incomplete: string; limitation: string; limitationNetwork: string; limitationNetworkFailed: string };
  report: {
    title: string;
    generatedAt: string;
    riskScore: string;
    coverage: string;
    hitCount: string;
    status: string;
    region: string;
    signals: string;
    recommendations: string;
    context: string;
    weight: string;
    contribution: string;
    copy: string;
    copied: string;
    copyFailed: string;
    download: string;
  };
};

export function countryDisplayName(code: string, locale: LocaleCode) {
  try {
    return new Intl.DisplayNames([locale], { type: "region" }).of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export const detectorLocaleText: Record<LocaleCode, DetectorLocaleText> = {
  zh: {
    pending: "等待检测",
    unknown: "未知",
    signalLabels: { timezone: "系统时区", language: "浏览器语言", languageVariant: "语言文字特征", chineseFonts: "字体地区特征", vendorFonts: "厂商字体特征", domesticBrowser: "浏览器地区特征", domesticDevice: "设备地区特征", locale: "Intl 区域设置", timezoneOffset: "时区偏移", emojiStyle: "Emoji 渲染风格", country: "IP 所在国家", ipAddress: "IP 地址", os: "操作系统", browserIpLocation: "IP 位置", browserIpAsn: "ASN", browserIpOrg: "网络组织", browser: "浏览器/应用环境", device: "设备/系统线索", ipCountryRisk: "IP 风险国家", claudeAccessRisk: "Claude 访问风险" },
    signalValues: { unknown: "未知", noBrands: "无 UA-CH brands", noLanguageVariant: "未命中重点语言文字", simplifiedChinese: "中文简体", traditionalChinese: "中文繁体", scFonts: "中国字体", tcFonts: "中文繁体字体", noFonts: "未命中重点地区字体", vendorFonts: "设备厂商字体", noVendorFonts: "未命中设备厂商字体", noDevice: "未命中重点设备特征", unknownBrowser: "未知浏览器", unknownSystem: "未知系统", wechatBrowser: "微信内置浏览器", androidDevice: "Android 设备", linuxDevice: "Linux 设备", appleEmoji: "Apple Emoji 风格", androidEmoji: "Android / 厂商 Emoji 风格", windowsEmoji: "Windows Emoji 风格", unknownEmoji: "未知 Emoji 风格", read: "已读取" },
    regions: { auto: "自动检测", cn: "中国大陆", hk: "香港", ru: "俄罗斯", ir: "伊朗" },
    status: { restricted: "高风险 / 可能受限", possibly_supported: "需要进一步确认", unsupported: "不支持", supported: "未发现地区冲突", unknown: "未确认" },
    risk: { waiting: "等待检测", checking: "检测中", supported: "未见明显风险", blocked: "高危环境", high: "中度风险", light: "轻度风险", unknown: "未确认", scoreLabel: "环境风险" },
    valueMap: { "中国大陆 IP": "中国大陆 IP", "访问和订阅风险极高": "访问和订阅风险极高" },
    confidence: { high: "高度疑似", medium: "疑似", low: "少量命中", safe: "未命中重点地区环境信号" },
    notEvaluated: "未检测",
    coverageLabel: "可评估信号",
    coverageInsufficient: "部分信号未能评估，暂时无法确认地区风险。",
    network: {
      toggleLabel: "同时检测网络出口（IP）",
      toggleHint: "浏览器直连 {provider} 查询。本站不经过服务器转发，但该服务会看到你的 IP。",
      idle: "网络层：默认通过 {provider} 查询本机出口 IP，可随时关闭。请求由浏览器直连第三方服务，本站不接收或存储查询结果。",
      checking: "网络层：正在通过 {provider} 查询出口 IP…",
      success: "网络层：已通过 {provider} 获取出口 IP。查询由浏览器直连第三方服务，本站不接收或存储该数据。",
      failed: "网络层：{provider} 查询失败或超时，已跳过 IP 信号；缺少网络证据不会抬高分数。可重试，或在下次检测时关闭网络层。",
      disabled: "网络层：已关闭。本次仅基于浏览器信号评分，未向第三方发送 IP 查询请求。",
      unavailable: "查询失败",
    },
    settings: { label: "检测设置", networkOn: "网络层开启", networkOff: "网络层关闭", changeHint: "修改检测目标会清空当前结果，请重新点击检测。" },
    recommendationsTitle: "下一步建议",
    recommendations: {
      high: "命中多项高风险信号。若当前环境与账号常用地区不一致，建议先停止在该环境登录或订阅，核对一致后再使用。",
      medium: "存在部分地区相关信号。建议核对浏览器语言、系统时区与账号资料是否一致，并避免频繁切换网络环境。",
      low: "未发现明显的高风险组合，但结果不代表账号一定安全；平台风控还会参考登录行为和支付信息。",
      incomplete: "部分信号无法评估（例如网络查询失败），当前结论可能不完整；可重试检测或更换主流浏览器。",
      limitation: "结果仅基于本机浏览器信号；网络层已关闭，未请求 IP 或网络出口，不读取账号或 Cookie，也不代表 Anthropic 的实际风控结论。",
      limitationNetwork: "结果基于浏览器信号与第三方 IP 地理位置做启发式判断；不读取账号或 Cookie，不识别 VPN/代理，也不代表 Anthropic 的实际风控结论。",
      limitationNetworkFailed: "网络层查询失败，本轮仅基于浏览器信号判断；缺少 IP 证据不会抬高或降低风险分，不读取账号或 Cookie，也不代表 Anthropic 的实际风控结论。",
    },
    report: {
      title: "Claude 环境检测报告",
      generatedAt: "生成时间",
      riskScore: "风险分",
      coverage: "可评估覆盖",
      hitCount: "命中信号",
      status: "状态",
      region: "目标地区",
      signals: "检测信号",
      recommendations: "建议",
      context: "上下文，不计分",
      weight: "权重",
      contribution: "贡献",
      copy: "复制报告",
      copied: "已复制",
      copyFailed: "复制失败",
      download: "下载 JSON",
    },
  },
  "zh-HK": {
    pending: "等待檢測",
    unknown: "未知",
    signalLabels: { timezone: "系統時區", language: "瀏覽器語言", languageVariant: "語言文字特徵", chineseFonts: "字體地區特徵", vendorFonts: "廠商字體特徵", domesticBrowser: "瀏覽器地區特徵", domesticDevice: "設備地區特徵", locale: "Intl 區域設定", timezoneOffset: "時區偏移", emojiStyle: "Emoji 渲染風格", country: "IP 所在國家", ipAddress: "IP 地址", os: "作業系統", browserIpLocation: "IP 位置", browserIpAsn: "ASN", browserIpOrg: "網絡組織", browser: "瀏覽器/應用環境", device: "設備/系統線索", ipCountryRisk: "IP 風險國家", claudeAccessRisk: "Claude 訪問風險" },
    signalValues: { unknown: "未知", noBrands: "無 UA-CH brands", noLanguageVariant: "未命中重點語言文字", simplifiedChinese: "中文簡體", traditionalChinese: "中文繁體", scFonts: "中國內地字體", tcFonts: "中文繁體字體", noFonts: "未命中重點地區字體", vendorFonts: "設備廠商字體", noVendorFonts: "未命中設備廠商字體", noDevice: "未命中重點設備特徵", unknownBrowser: "未知瀏覽器", unknownSystem: "未知系統", wechatBrowser: "微信內置瀏覽器", androidDevice: "Android 設備", linuxDevice: "Linux 設備", appleEmoji: "Apple Emoji 風格", androidEmoji: "Android / 廠商 Emoji 風格", windowsEmoji: "Windows Emoji 風格", unknownEmoji: "未知 Emoji 風格", read: "已讀取" },
    regions: { auto: "自動檢測", cn: "中國內地", hk: "香港", ru: "俄羅斯", ir: "伊朗" },
    status: { restricted: "高風險 / 可能受限", possibly_supported: "需要進一步確認", unsupported: "不支援", supported: "未發現地區衝突", unknown: "未確認" },
    risk: { waiting: "等待檢測", checking: "檢測中", supported: "未見明顯風險", blocked: "高危環境", high: "中度風險", light: "輕度風險", unknown: "未確認", scoreLabel: "環境風險" },
    valueMap: { "中国大陆 IP": "中國內地 IP", "访问和订阅风险极高": "訪問和訂閱風險極高" },
    confidence: { high: "高度疑似", medium: "疑似", low: "少量命中", safe: "未命中重點地區環境訊號" },
    notEvaluated: "未檢測",
    coverageLabel: "可評估訊號",
    coverageInsufficient: "部分訊號未能評估，暫時無法確認地區風險。",
    network: {
      toggleLabel: "同時檢測網絡出口（IP）",
      toggleHint: "瀏覽器直連 {provider} 查詢。本站不經伺服器轉發，但該服務會看到你的 IP。",
      idle: "網絡層：預設透過 {provider} 查詢本機出口 IP，可隨時關閉。請求由瀏覽器直連第三方服務，本站不接收或儲存查詢結果。",
      checking: "網絡層：正在透過 {provider} 查詢出口 IP…",
      success: "網絡層：已透過 {provider} 取得出口 IP。查詢由瀏覽器直連第三方服務，本站不接收或儲存該資料。",
      failed: "網絡層：{provider} 查詢失敗或逾時，已略過 IP 訊號；缺少網絡證據不會抬高分數。可重試，或在下次檢測時關閉網絡層。",
      disabled: "網絡層：已關閉。本次僅基於瀏覽器訊號評分，未向第三方傳送 IP 查詢請求。",
      unavailable: "查詢失敗",
    },
    settings: { label: "檢測設定", networkOn: "網絡層已開啟", networkOff: "網絡層已關閉", changeHint: "修改檢測目標會清空目前結果，請重新點擊檢測。" },
    recommendationsTitle: "下一步建議",
    recommendations: {
      high: "命中多項高風險訊號。若目前環境與帳號常用地區不一致，建議先停止在該環境登入或訂閱，核對一致後再使用。",
      medium: "存在部分地區相關訊號。建議核對瀏覽器語言、系統時區與帳號資料是否一致，並避免頻繁切換網絡環境。",
      low: "未發現明顯的高風險組合，但結果不代表帳號一定安全；平台風控還會參考登入行為和付款資料。",
      incomplete: "部分訊號無法評估（例如網絡查詢失敗），目前結論可能不完整；可重試檢測或更換主流瀏覽器。",
      limitation: "結果僅基於本機瀏覽器訊號；網絡層已關閉，未請求 IP 或網絡出口，不讀取帳號或 Cookie，也不代表 Anthropic 的實際風控結論。",
      limitationNetwork: "結果基於瀏覽器訊號與第三方 IP 地理位置作啟發式判斷；不讀取帳號或 Cookie，不識別 VPN/代理，也不代表 Anthropic 的實際風控結論。",
      limitationNetworkFailed: "網絡層查詢失敗，本輪僅基於瀏覽器訊號判斷；缺少 IP 證據不會抬高或降低風險分，不讀取帳號或 Cookie，也不代表 Anthropic 的實際風控結論。",
    },
    report: {
      title: "Claude 環境檢測報告",
      generatedAt: "生成時間",
      riskScore: "風險分",
      coverage: "可評估覆蓋",
      hitCount: "命中訊號",
      status: "狀態",
      region: "目標地區",
      signals: "檢測訊號",
      recommendations: "建議",
      context: "上下文，不計分",
      weight: "權重",
      contribution: "貢獻",
      copy: "複製報告",
      copied: "已複製",
      copyFailed: "複製失敗",
      download: "下載 JSON",
    },
  },
  ru: {
    pending: "Ожидание проверки",
    unknown: "Неизвестно",
    signalLabels: { timezone: "Часовой пояс", language: "Язык браузера", languageVariant: "Языковые признаки", chineseFonts: "Региональные шрифты", vendorFonts: "Шрифты производителя", domesticBrowser: "Регион браузера", domesticDevice: "Регион устройства", locale: "Intl locale", timezoneOffset: "Смещение времени", emojiStyle: "Стиль Emoji", country: "Страна IP", ipAddress: "IP-адрес", os: "ОС", browserIpLocation: "IP-локация", browserIpAsn: "ASN", browserIpOrg: "Сетевая организация", browser: "Браузер/приложение", device: "Устройство/система", ipCountryRisk: "Страна риска IP", claudeAccessRisk: "Риск доступа Claude" },
    signalValues: { unknown: "Неизвестно", noBrands: "Нет UA-CH brands", noLanguageVariant: "Ключевые языковые признаки не найдены", simplifiedChinese: "Упрощенный китайский", traditionalChinese: "Традиционный китайский", scFonts: "Китайские шрифты", tcFonts: "Традиционные китайские шрифты", noFonts: "Ключевые региональные шрифты не найдены", vendorFonts: "Шрифты производителя", noVendorFonts: "Шрифты производителя не найдены", noDevice: "Ключевые признаки устройства не найдены", unknownBrowser: "Неизвестный браузер", unknownSystem: "Неизвестная система", wechatBrowser: "Встроенный браузер WeChat", androidDevice: "Android-устройство", linuxDevice: "Linux-устройство", appleEmoji: "Стиль Apple Emoji", androidEmoji: "Стиль Android / производителя", windowsEmoji: "Стиль Windows Emoji", unknownEmoji: "Неизвестный стиль Emoji", read: "Считано" },
    regions: { auto: "Автоопределение", cn: "Китай", hk: "Гонконг", ru: "Россия", ir: "Иран" },
    status: { restricted: "Высокий риск / возможно ограничено", possibly_supported: "Нужно уточнение", unsupported: "Не поддерживается", supported: "Конфликтов не найдено", unknown: "Не подтверждено" },
    risk: { waiting: "Ожидание", checking: "Проверка", supported: "Явных рисков нет", blocked: "Высокий риск среды", high: "Средний риск", light: "Низкий риск", unknown: "Не подтверждено", scoreLabel: "Риск среды" },
    valueMap: { "中国大陆 IP": "IP материкового Китая", "访问和订阅风险极高": "Очень высокий риск доступа и подписки" },
    confidence: { high: "Высокая вероятность", medium: "Возможные признаки", low: "Небольшое совпадение", safe: "Ключевые региональные сигналы не найдены" },
    notEvaluated: "Не проверено",
    coverageLabel: "Оценено сигналов",
    coverageInsufficient: "Часть сигналов не оценена, поэтому риск региона пока нельзя подтвердить.",
    network: {
      toggleLabel: "Проверять сетевой выход (IP)",
      toggleHint: "Браузер обращается к {provider} напрямую. Сайт не проксирует запрос, но провайдер увидит ваш IP.",
      idle: "Сетевой слой: по умолчанию браузер запрашивает ваш публичный IP у {provider}. Это можно отключить. Запрос идёт напрямую третьей стороне; сайт не получает и не хранит результат.",
      checking: "Сетевой слой: запрашиваем публичный IP через {provider}…",
      success: "Сетевой слой: публичный IP получен через {provider}. Запрос отправлен напрямую из браузера; сайт не получает и не хранит его.",
      failed: "Сетевой слой: запрос к {provider} не удался или превысил время ожидания, IP-сигналы пропущены. Отсутствие сетевых данных не завышает оценку. Повторите проверку или отключите сетевой слой.",
      disabled: "Сетевой слой: отключён. Проверка использует только сигналы браузера и не отправляет запросы третьей стороне.",
      unavailable: "Не получено",
    },
    settings: { label: "Настройки", networkOn: "Сетевой слой вкл.", networkOff: "Сетевой слой выкл.", changeHint: "Смена цели проверки очистит текущий результат; запустите проверку снова." },
    recommendationsTitle: "Рекомендации",
    recommendations: {
      high: "Обнаружено несколько сигналов высокого риска. Если среда отличается от обычного региона аккаунта, не входите и не оформляйте подписку до устранения расхождений.",
      medium: "Есть отдельные региональные сигналы. Проверьте согласованность языка браузера, часового пояса и данных аккаунта; избегайте частой смены сети.",
      low: "Явных сочетаний высокого риска не найдено, но это не гарантирует безопасность аккаунта: учитываются также входы и платежные данные.",
      incomplete: "Часть сигналов недоступна (например, сетевой запрос не удался), вывод может быть неполным. Повторите проверку или используйте популярный браузер.",
      limitation: "Результат основан только на сигналах браузера; сетевой слой отключён, IP и сетевой выход не запрашивались. Аккаунт и Cookie не читаются; результат не является решением Anthropic.",
      limitationNetwork: "Результат — эвристика на основе сигналов браузера и геолокации IP от третьей стороны. Аккаунт и Cookie не читаются, VPN/прокси не определяются; результат не является решением Anthropic.",
      limitationNetworkFailed: "Сетевой запрос не удался, поэтому результат основан только на сигналах браузера; отсутствие IP-данных не повышает и не понижает оценку. Аккаунт и Cookie не читаются; результат не является решением Anthropic.",
    },
    report: {
      title: "Отчёт о проверке окружения Claude",
      generatedAt: "Время создания",
      riskScore: "Оценка риска",
      coverage: "Покрытие",
      hitCount: "Совпавшие сигналы",
      status: "Статус",
      region: "Целевой регион",
      signals: "Сигналы",
      recommendations: "Рекомендации",
      context: "Контекст, без оценки",
      weight: "Вес",
      contribution: "Вклад",
      copy: "Копировать отчёт",
      copied: "Скопировано",
      copyFailed: "Не удалось скопировать",
      download: "Скачать JSON",
    },
  },
  en: {
    pending: "Waiting",
    unknown: "Unknown",
    signalLabels: { timezone: "System timezone", language: "Browser language", languageVariant: "Language variant", chineseFonts: "Regional fonts", vendorFonts: "Vendor fonts", domesticBrowser: "Browser region traits", domesticDevice: "Device region traits", locale: "Intl locale", timezoneOffset: "Timezone offset", emojiStyle: "Emoji rendering style", country: "IP country", ipAddress: "IP address", os: "Operating system", browserIpLocation: "IP location", browserIpAsn: "ASN", browserIpOrg: "Network organization", browser: "Browser/app environment", device: "Device/system signals", ipCountryRisk: "IP risk country", claudeAccessRisk: "Claude access risk" },
    signalValues: { unknown: "Unknown", noBrands: "No UA-CH brands", noLanguageVariant: "No key language variant detected", simplifiedChinese: "Simplified Chinese", traditionalChinese: "Traditional Chinese", scFonts: "Simplified Chinese fonts", tcFonts: "Traditional Chinese fonts", noFonts: "No key regional fonts detected", vendorFonts: "Vendor fonts", noVendorFonts: "No vendor fonts detected", noDevice: "No key device traits detected", unknownBrowser: "Unknown browser", unknownSystem: "Unknown system", wechatBrowser: "WeChat in-app browser", androidDevice: "Android device", linuxDevice: "Linux device", appleEmoji: "Apple Emoji style", androidEmoji: "Android / vendor Emoji style", windowsEmoji: "Windows Emoji style", unknownEmoji: "Unknown Emoji style", read: "Read" },
    regions: { auto: "Auto detect", cn: "Mainland China", hk: "Hong Kong", ru: "Russia", ir: "Iran" },
    status: { restricted: "High risk / possibly restricted", possibly_supported: "Needs confirmation", unsupported: "Unsupported", supported: "No regional conflict found", unknown: "Unconfirmed" },
    risk: { waiting: "Waiting", checking: "Checking", supported: "No obvious risk", blocked: "High environment risk", high: "Moderate risk", light: "Light risk", unknown: "Unconfirmed", scoreLabel: "Environment risk" },
    valueMap: { "中国大陆 IP": "Mainland China IP", "访问和订阅风险极高": "Very high access and subscription risk" },
    confidence: { high: "Highly likely", medium: "Likely", low: "Lightly matched", safe: "No key regional signals found" },
    notEvaluated: "Not evaluated",
    coverageLabel: "Evaluated signals",
    coverageInsufficient: "Some signals could not be evaluated, so regional risk cannot be confirmed.",
    network: {
      toggleLabel: "Also check network egress (IP)",
      toggleHint: "Your browser queries {provider} directly. This site does not proxy the request, but the provider will see your IP.",
      idle: "Network layer: by default your browser queries {provider} for your public IP. You can turn this off. The request goes directly to the third party; this site does not receive or store the result.",
      checking: "Network layer: querying your public IP via {provider}…",
      success: "Network layer: public IP retrieved via {provider}. The request was sent directly from your browser; this site does not receive or store it.",
      failed: "Network layer: the {provider} lookup failed or timed out, so IP signals were skipped. Missing network evidence does not inflate the score. Retry, or turn the network layer off for the next check.",
      disabled: "Network layer: off. This check uses browser signals only and sent no IP lookup request to a third party.",
      unavailable: "Lookup failed",
    },
    settings: { label: "Check settings", networkOn: "Network on", networkOff: "Network off", changeHint: "Changing the target clears the current result. Run the check again." },
    recommendationsTitle: "Next steps",
    recommendations: {
      high: "Multiple high-risk signals matched. If this environment differs from your account's usual region, avoid signing in or subscribing here until the mismatch is resolved.",
      medium: "Some region-related signals matched. Check that browser language, system timezone, and account details are consistent, and avoid frequent network switching.",
      low: "No clear high-risk combination was found, but this does not guarantee account safety; platform risk controls also consider sign-in behavior and payment details.",
      incomplete: "Some signals could not be evaluated (for example, the network lookup failed), so the conclusion may be incomplete. Retry the check or use a mainstream browser.",
      limitation: "The result uses local browser signals only. The network layer was off, so no IP or network egress data was requested. It does not read your account or cookies and does not represent Anthropic's actual risk decision.",
      limitationNetwork: "The result is a heuristic based on browser signals and third-party IP geolocation. It does not read your account or cookies, does not detect VPNs or proxies, and does not represent Anthropic's actual risk decision.",
      limitationNetworkFailed: "The network lookup failed, so this run relies on browser signals only. Missing IP evidence does not raise or lower the score; the check does not read your account or cookies and does not represent Anthropic's actual risk decision.",
    },
    report: {
      title: "Claude Environment Check Report",
      generatedAt: "Generated",
      riskScore: "Risk score",
      coverage: "Coverage",
      hitCount: "Matched signals",
      status: "Status",
      region: "Target region",
      signals: "Signals",
      recommendations: "Recommendations",
      context: "Context, not scored",
      weight: "Weight",
      contribution: "Contribution",
      copy: "Copy report",
      copied: "Copied",
      copyFailed: "Copy failed",
      download: "Download JSON",
    },
  },
};
