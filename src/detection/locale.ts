// CheckCC 的检测模块本地化工具，用于定义检测文案结构并按语言展示地区和信号值。
import type { LocaleCode } from "@/i18n/messages";
import type { RegionCode } from "./types";

export type DetectorLocaleText = {
  pending: string;
  unknown: string;
  signalLabels: Record<string, string>;
  signalValues: Record<string, string>;
  regions: Record<RegionCode, string>;
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
    fallbackHint: string;
    idle: string;
    checking: string;
    success: string;
    failed: string;
    disabled: string;
    unavailable: string;
    enableAndRetry: string;
  };
  settings: { label: string; networkOn: string; networkOff: string; changeHint: string };
  recommendationsTitle: string;
  recommendations: { high: string; medium: string; low: string; incomplete: string; limitation: string; limitationNetwork: string; limitationNetworkFailed: string };
  fix: { hint: string; cta: string; dialogTitle: string; dialogDesc: string; dialogNote: string; dialogProvider: string; dialogConfirm: string; dialogCancel: string };
  report: {
    title: string;
    generatedAt: string;
    riskScore: string;
    coverage: string;
    hitCount: string;
    status: string;
    region: string;
    target: string;
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
    signalLabels: { timezone: "系统时区", language: "浏览器语言", languageVariant: "语言文字特征", chineseFonts: "字体地区特征", vendorFonts: "厂商字体特征", domesticBrowser: "浏览器地区特征", domesticDevice: "设备地区特征", locale: "Intl 区域设置", intlFormat: "日期/数字格式", timezoneOffset: "时区偏移", emojiStyle: "Emoji 渲染风格", country: "IP 所在国家", webrtc: "WebRTC 出口", exitConsistency: "出口一致性", ipv6Leak: "WebRTC IPv6 出口", ipTimezone: "IP 与系统时区", ipAddress: "IP 地址", ipType: "IP 类型（启发式）", ipv6Egress: "IPv6 直连出口", claudeAiReachability: "claude.ai 边缘可达性", anthropicSiteReachability: "Anthropic 官网可达性", apiReachability: "API 端点可达性", anthropicEndpointSummary: "Anthropic 端点汇总", os: "操作系统", browserIpLocation: "IP 位置", browserIpAsn: "ASN", browserIpOrg: "网络组织", browser: "浏览器/应用环境", device: "设备/系统线索", ipCountryRisk: "IP 风险国家", claudeAccessRisk: "Claude 访问风险" },
    signalValues: { unknown: "未知", noBrands: "无 UA-CH brands", noLanguageVariant: "未命中重点语言文字", simplifiedChinese: "中文简体", traditionalChinese: "中文繁体", scFonts: "中国字体", tcFonts: "中文繁体字体", noFonts: "未命中额外安装的中文字体", bundledFonts: "系统自带（不计分）", vendorFonts: "设备厂商字体", noVendorFonts: "未命中设备厂商字体", noDevice: "未命中重点设备特征", unknownBrowser: "未知浏览器", unknownSystem: "未知系统", wechatBrowser: "微信内置浏览器", androidDevice: "Android 设备", linuxDevice: "Linux 设备", appleEmoji: "Apple Emoji 风格", androidEmoji: "Android / 厂商 Emoji 风格", windowsEmoji: "Windows Emoji 风格", unknownEmoji: "未知 Emoji 风格", read: "已读取", webrtcUnsupported: "浏览器不支持 WebRTC", webrtcTimeout: "STUN 收集超时", webrtcError: "STUN 探测失败", webrtcNoPublic: "未获得公网候选", webrtcNoCompare: "没有同协议族候选", webrtcMatch: "与 HTTP 出口一致", webrtcMismatch: "与 HTTP 出口不一致", exitMatch: "HTTP 与 WebRTC 出口一致", exitMismatch: "HTTP 与 WebRTC 出口不一致", exitUnknown: "无法比较", exitExtra: "另有出口 {addresses}", ipv6None: "未发现公网 IPv6 候选", ipv6Same: "与 HTTP 出口一致", ipv6Diff: "与 HTTP 出口不一致", ipv6Separate: "存在独立 IPv6 出口", ipv6Unknown: "无法比较", ipTimezoneMatch: "与浏览器时区一致", ipTimezoneMismatch: "与浏览器时区不一致", latency_low: "低延迟", latency_medium: "中等延迟", latency_high: "高延迟", reachabilityTimeout: "超时", reachabilityError: "未完成", reachabilityAll: "全部完成", reachabilityPartial: "部分完成", reachabilityNone: "均未完成", reachabilityFastest: "最快 {ms} ms", ipType_datacenter: "数据中心 / 云主机", ipType_residential: "住宅宽带", ipType_carrier: "运营商网络", ipType_unknown: "未识别", ipv6EgressMatch: "与 HTTP IPv6 出口一致", ipv6EgressMismatch: "与 HTTP IPv6 出口不一致", ipv6EgressDifferentFamily: "HTTP 为 IPv4，独立 IPv6 出口", ipv6EgressTimeout: "IPv6 探测超时", ipv6EgressNetwork: "IPv6 连接未完成", ipv6EgressInvalid: "未取得公网 IPv6 地址" },
    regions: { auto: "自动检测", cn: "中国大陆", hk: "香港", ru: "俄罗斯", ir: "伊朗" },
    status: { restricted: "高风险 / 可能受限", possibly_supported: "需要进一步确认", unsupported: "不支持", supported: "未发现地区冲突", unknown: "未确认" },
    risk: { waiting: "等待检测", checking: "检测中", supported: "未见明显风险", blocked: "高危环境", high: "中度风险", light: "轻度风险", unknown: "未确认", scoreLabel: "环境风险" },
    valueMap: { "中国大陆 IP": "中国大陆 IP", "访问和订阅风险极高": "访问和订阅风险极高" },
    confidence: { high: "高度疑似", medium: "疑似", low: "少量命中", safe: "未命中重点地区环境信号" },
    notEvaluated: "未检测",
    coverageLabel: "可评估信号",
    coverageInsufficient: "部分信号未能评估，暂时无法确认地区风险。",
    network: {
      toggleLabel: "同时检测网络出口（IP / WebRTC / IPv6 / Claude 端点）",
      toggleHint: "浏览器直连 {provider} 查询 IP，通过 STUN 收集 WebRTC 出口，并探测 claude.ai 边缘诊断路径、www.anthropic.com、api.anthropic.com 与 IPv6 直连出口。claude.ai 主站受跨域策略保护，浏览器无法直接探测。本站不经过服务器转发，但这些第三方服务会看到你的 IP。",
      fallbackHint: "主服务失败或被限流时会自动尝试备用服务 {fallback}；两个服务都会看到你的 IP。",
      idle: "网络层：已开启。检测时浏览器将通过 {provider} 查询出口 IP，通过 STUN 收集 WebRTC 候选，并直连 Anthropic 相关端点与 IPv6 探测服务；请求由浏览器直连第三方，本站不接收或存储结果。",
      checking: "网络层：正在通过 {provider} 查询出口 IP，并收集 WebRTC、Anthropic 端点与 IPv6 出口结果…",
      success: "网络层：已通过 {provider} 获取出口 IP，并执行了 WebRTC、Anthropic 端点与 IPv6 出口探测。各项结果分别显示；探测未完成不代表对应能力不可用。请求由浏览器直连第三方，本站不接收或存储该数据。",
      failed: "网络层：{provider} 查询失败或超时，IP 归属信号已跳过；Anthropic 端点与 IPv6 直连探测仍会单独显示。缺少网络证据不会抬高分数。",
      disabled: "网络层：已关闭。本次仅基于浏览器信号评分，未向第三方发送 IP 查询、STUN、IPv6 查询或 Anthropic 端点请求。",
      unavailable: "查询失败",
      enableAndRetry: "开启网络层并重测",
    },
    settings: { label: "检测设置", networkOn: "网络层开启", networkOff: "网络层关闭", changeHint: "修改检测目标会清空当前结果，请重新点击检测。" },
    recommendationsTitle: "下一步建议",
    recommendations: {
      high: "命中多项高风险信号。若当前环境与账号常用地区不一致，建议先停止在该环境登录或订阅，核对一致后再使用。",
      medium: "存在部分地区相关信号。建议核对浏览器语言、系统时区与账号资料是否一致，并避免频繁切换网络环境。",
      low: "未发现明显的高风险组合，但结果不代表账号一定安全；平台风控还会参考登录行为和支付信息。",
      incomplete: "部分信号无法评估（例如网络查询失败），当前结论可能不完整；可重试检测或更换主流浏览器。",
      limitation: "结果仅基于本机浏览器信号；网络层已关闭，未请求 IP 或网络出口，也未发起 STUN 请求，不读取账号或 Cookie，也不代表 Anthropic 的实际风控结论。",
      limitationNetwork: "结果基于浏览器信号、第三方 IP 地理位置、WebRTC 出口与 Anthropic 端点请求完成情况做启发式判断；claude.ai 仅探测边缘路径，不能判断登录或订阅可用性；不读取账号、Cookie 或响应内容，不能识别所有 VPN/代理，也不代表 Anthropic 的实际风控结论。",
      limitationNetworkFailed: "IP 归属查询失败，本轮结合浏览器信号、Anthropic 端点请求完成情况与 IPv6 直连结果判断；claude.ai 仅探测边缘路径，缺少 IP 证据不会抬高或降低风险分，不读取账号、Cookie 或响应内容，也不代表 Anthropic 的实际风控结论。",
    },
    fix: {
      hint: "浏览器检测看不到终端环境、Claude Code 配置和系统级设置，可用本地客户端继续核对并修复。",
      cta: "一键修复，降低封号风险",
      dialogTitle: "使用 CG-Claude 检查并修复本机环境",
      dialogDesc: "CG-Claude 是 LcodeCoder 提供的第三方桌面客户端，支持 macOS、Windows 和 Linux。它会检测本机时区、终端环境、浏览器设置与 Claude Code 配置，并在预览后应用修改，需要时可从备份恢复。",
      dialogNote: "点击确认后会打开 GitHub 仓库，请在 Releases 中下载对应系统的安装包并自行核对来源。CheckCC 不会自动下载或安装，也不会把本次检测结果发送给第三方；第三方工具的效果和安全性请自行判断。",
      dialogProvider: "第三方项目 · LcodeCoder/CG-Claude",
      dialogConfirm: "前往 GitHub 下载",
      dialogCancel: "取消",
    },
    report: {
      title: "Claude 环境检测报告",
      generatedAt: "生成时间",
      riskScore: "风险分",
      coverage: "可评估覆盖",
      hitCount: "命中信号",
      status: "状态",
      region: "检测地区",
      target: "检测目标",
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
    signalLabels: { timezone: "系統時區", language: "瀏覽器語言", languageVariant: "語言文字特徵", chineseFonts: "字體地區特徵", vendorFonts: "廠商字體特徵", domesticBrowser: "瀏覽器地區特徵", domesticDevice: "設備地區特徵", locale: "Intl 區域設定", intlFormat: "日期/數字格式", timezoneOffset: "時區偏移", emojiStyle: "Emoji 渲染風格", country: "IP 所在國家", webrtc: "WebRTC 出口", exitConsistency: "出口一致性", ipv6Leak: "WebRTC IPv6 出口", ipTimezone: "IP 與系統時區", ipAddress: "IP 地址", ipType: "IP 類型（啟發式）", ipv6Egress: "IPv6 直連出口", claudeAiReachability: "claude.ai 邊緣可達性", anthropicSiteReachability: "Anthropic 官網可達性", apiReachability: "API 端點可達性", anthropicEndpointSummary: "Anthropic 端點匯總", os: "作業系統", browserIpLocation: "IP 位置", browserIpAsn: "ASN", browserIpOrg: "網絡組織", browser: "瀏覽器/應用環境", device: "設備/系統線索", ipCountryRisk: "IP 風險國家", claudeAccessRisk: "Claude 訪問風險" },
    signalValues: { unknown: "未知", noBrands: "無 UA-CH brands", noLanguageVariant: "未命中重點語言文字", simplifiedChinese: "中文簡體", traditionalChinese: "中文繁體", scFonts: "中國內地字體", tcFonts: "中文繁體字體", noFonts: "未命中額外安裝的中文字體", bundledFonts: "系統自帶（不計分）", vendorFonts: "設備廠商字體", noVendorFonts: "未命中設備廠商字體", noDevice: "未命中重點設備特徵", unknownBrowser: "未知瀏覽器", unknownSystem: "未知系統", wechatBrowser: "微信內置瀏覽器", androidDevice: "Android 設備", linuxDevice: "Linux 設備", appleEmoji: "Apple Emoji 風格", androidEmoji: "Android / 廠商 Emoji 風格", windowsEmoji: "Windows Emoji 風格", unknownEmoji: "未知 Emoji 風格", read: "已讀取", webrtcUnsupported: "瀏覽器不支援 WebRTC", webrtcTimeout: "STUN 收集逾時", webrtcError: "STUN 探測失敗", webrtcNoPublic: "未取得公網候選", webrtcNoCompare: "沒有同協議族候選", webrtcMatch: "與 HTTP 出口一致", webrtcMismatch: "與 HTTP 出口不一致", exitMatch: "HTTP 與 WebRTC 出口一致", exitMismatch: "HTTP 與 WebRTC 出口不一致", exitUnknown: "無法比較", exitExtra: "另有出口 {addresses}", ipv6None: "未發現公網 IPv6 候選", ipv6Same: "與 HTTP 出口一致", ipv6Diff: "與 HTTP 出口不一致", ipv6Separate: "存在獨立 IPv6 出口", ipv6Unknown: "無法比較", ipTimezoneMatch: "與瀏覽器時區一致", ipTimezoneMismatch: "與瀏覽器時區不一致", latency_low: "低延遲", latency_medium: "中等延遲", latency_high: "高延遲", reachabilityTimeout: "逾時", reachabilityError: "未完成", reachabilityAll: "全部完成", reachabilityPartial: "部分完成", reachabilityNone: "均未完成", reachabilityFastest: "最快 {ms} ms", ipType_datacenter: "數據中心 / 雲主機", ipType_residential: "住宅寬頻", ipType_carrier: "營運商網絡", ipType_unknown: "未識別", ipv6EgressMatch: "與 HTTP IPv6 出口一致", ipv6EgressMismatch: "與 HTTP IPv6 出口不一致", ipv6EgressDifferentFamily: "HTTP 為 IPv4，獨立 IPv6 出口", ipv6EgressTimeout: "IPv6 探測逾時", ipv6EgressNetwork: "IPv6 連線未完成", ipv6EgressInvalid: "未取得公網 IPv6 地址" },
    regions: { auto: "自動檢測", cn: "中國內地", hk: "香港", ru: "俄羅斯", ir: "伊朗" },
    status: { restricted: "高風險 / 可能受限", possibly_supported: "需要進一步確認", unsupported: "不支援", supported: "未發現地區衝突", unknown: "未確認" },
    risk: { waiting: "等待檢測", checking: "檢測中", supported: "未見明顯風險", blocked: "高危環境", high: "中度風險", light: "輕度風險", unknown: "未確認", scoreLabel: "環境風險" },
    valueMap: { "中国大陆 IP": "中國內地 IP", "访问和订阅风险极高": "訪問和訂閱風險極高" },
    confidence: { high: "高度疑似", medium: "疑似", low: "少量命中", safe: "未命中重點地區環境訊號" },
    notEvaluated: "未檢測",
    coverageLabel: "可評估訊號",
    coverageInsufficient: "部分訊號未能評估，暫時無法確認地區風險。",
    network: {
      toggleLabel: "同時檢測網絡出口（IP / WebRTC / IPv6 / Claude 端點）",
      toggleHint: "瀏覽器直連 {provider} 查詢 IP，透過 STUN 收集 WebRTC 出口，並探測 claude.ai 邊緣診斷路徑、www.anthropic.com、api.anthropic.com 與 IPv6 直連出口。claude.ai 主站受跨域策略保護，瀏覽器無法直接探測。本站不經伺服器轉發，但這些第三方服務會看到你的 IP。",
      fallbackHint: "主服務失敗或被限流時會自動嘗試備用服務 {fallback}；兩個服務都會看到你的 IP。",
      idle: "網絡層：已開啟。檢測時瀏覽器將透過 {provider} 查詢出口 IP，透過 STUN 收集 WebRTC 候選，並直連 Anthropic 相關端點與 IPv6 探測服務；請求由瀏覽器直連第三方，本站不接收或儲存結果。",
      checking: "網絡層：正在透過 {provider} 查詢出口 IP，並收集 WebRTC、Anthropic 端點與 IPv6 出口結果…",
      success: "網絡層：已透過 {provider} 取得出口 IP，並執行了 WebRTC、Anthropic 端點與 IPv6 出口探測。各項結果分別顯示；探測未完成不代表對應能力不可用。請求由瀏覽器直連第三方，本站不接收或儲存該資料。",
      failed: "網絡層：{provider} 查詢失敗或逾時，IP 歸屬訊號已略過；Anthropic 端點與 IPv6 直連探測仍會單獨顯示。缺少網絡證據不會抬高分數。",
      disabled: "網絡層：已關閉。本次僅基於瀏覽器訊號評分，未向第三方傳送 IP 查詢、STUN、IPv6 查詢或 Anthropic 端點請求。",
      unavailable: "查詢失敗",
      enableAndRetry: "開啟網絡層並重測",
    },
    settings: { label: "檢測設定", networkOn: "網絡層已開啟", networkOff: "網絡層已關閉", changeHint: "修改檢測目標會清空目前結果，請重新點擊檢測。" },
    recommendationsTitle: "下一步建議",
    recommendations: {
      high: "命中多項高風險訊號。若目前環境與帳號常用地區不一致，建議先停止在該環境登入或訂閱，核對一致後再使用。",
      medium: "存在部分地區相關訊號。建議核對瀏覽器語言、系統時區與帳號資料是否一致，並避免頻繁切換網絡環境。",
      low: "未發現明顯的高風險組合，但結果不代表帳號一定安全；平台風控還會參考登入行為和付款資料。",
      incomplete: "部分訊號無法評估（例如網絡查詢失敗），目前結論可能不完整；可重試檢測或更換主流瀏覽器。",
      limitation: "結果僅基於本機瀏覽器訊號；網絡層已關閉，未請求 IP 或網絡出口，也未發起 STUN 請求，不讀取帳號或 Cookie，也不代表 Anthropic 的實際風控結論。",
      limitationNetwork: "結果基於瀏覽器訊號、第三方 IP 地理位置、WebRTC 出口與 Anthropic 端點請求完成情況作啟發式判斷；claude.ai 僅探測邊緣路徑，不能判斷登入或訂閱可用性；不讀取帳號、Cookie 或回應內容，不能識別所有 VPN/代理，也不代表 Anthropic 的實際風控結論。",
      limitationNetworkFailed: "IP 歸屬查詢失敗，本輪結合瀏覽器訊號、Anthropic 端點請求完成情況與 IPv6 直連結果判斷；claude.ai 僅探測邊緣路徑，缺少 IP 證據不會抬高或降低風險分，不讀取帳號、Cookie 或回應內容，也不代表 Anthropic 的實際風控結論。",
    },
    fix: {
      hint: "瀏覽器檢測看不到終端環境、Claude Code 設定和系統層級設定，可用本機客戶端繼續核對並修復。",
      cta: "一鍵修復，降低封號風險",
      dialogTitle: "使用 CG-Claude 檢查並修復本機環境",
      dialogDesc: "CG-Claude 是 LcodeCoder 提供的第三方桌面客戶端，支援 macOS、Windows 和 Linux。它會檢測本機時區、終端環境、瀏覽器設定與 Claude Code 設定，並在預覽後套用修改，需要時可從備份還原。",
      dialogNote: "點擊確認後會開啟 GitHub 倉庫，請在 Releases 中下載對應系統的安裝包並自行核對來源。CheckCC 不會自動下載或安裝，也不會把本次檢測結果傳送給第三方；第三方工具的效果和安全性請自行判斷。",
      dialogProvider: "第三方項目 · LcodeCoder/CG-Claude",
      dialogConfirm: "前往 GitHub 下載",
      dialogCancel: "取消",
    },
    report: {
      title: "Claude 環境檢測報告",
      generatedAt: "生成時間",
      riskScore: "風險分",
      coverage: "可評估覆蓋",
      hitCount: "命中訊號",
      status: "狀態",
      region: "檢測地區",
      target: "檢測目標",
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
    signalLabels: { timezone: "Часовой пояс", language: "Язык браузера", languageVariant: "Языковые признаки", chineseFonts: "Региональные шрифты", vendorFonts: "Шрифты производителя", domesticBrowser: "Регион браузера", domesticDevice: "Регион устройства", locale: "Intl locale", intlFormat: "Формат даты/чисел", timezoneOffset: "Смещение времени", emojiStyle: "Стиль Emoji", country: "Страна IP", webrtc: "WebRTC-выход", exitConsistency: "Совпадение выходов", ipv6Leak: "IPv6-выход WebRTC", ipTimezone: "Часовой пояс IP", ipAddress: "IP-адрес", ipType: "Тип IP (эвристика)", ipv6Egress: "Прямой IPv6-выход", claudeAiReachability: "Доступность edge claude.ai", anthropicSiteReachability: "Доступность сайта Anthropic", apiReachability: "Доступность API", anthropicEndpointSummary: "Сводка эндпоинтов Anthropic", os: "ОС", browserIpLocation: "IP-локация", browserIpAsn: "ASN", browserIpOrg: "Сетевая организация", browser: "Браузер/приложение", device: "Устройство/система", ipCountryRisk: "Страна риска IP", claudeAccessRisk: "Риск доступа Claude" },
    signalValues: { unknown: "Неизвестно", noBrands: "Нет UA-CH brands", noLanguageVariant: "Ключевые языковые признаки не найдены", simplifiedChinese: "Упрощенный китайский", traditionalChinese: "Традиционный китайский", scFonts: "Китайские шрифты", tcFonts: "Традиционные китайские шрифты", noFonts: "Дополнительно установленные китайские шрифты не найдены", bundledFonts: "Системные (не учитываются)", vendorFonts: "Шрифты производителя", noVendorFonts: "Шрифты производителя не найдены", noDevice: "Ключевые признаки устройства не найдены", unknownBrowser: "Неизвестный браузер", unknownSystem: "Неизвестная система", wechatBrowser: "Встроенный браузер WeChat", androidDevice: "Android-устройство", linuxDevice: "Linux-устройство", appleEmoji: "Стиль Apple Emoji", androidEmoji: "Стиль Android / производителя", windowsEmoji: "Стиль Windows Emoji", unknownEmoji: "Неизвестный стиль Emoji", read: "Считано", webrtcUnsupported: "Браузер не поддерживает WebRTC", webrtcTimeout: "Сбор STUN превысил время", webrtcError: "Ошибка STUN-проверки", webrtcNoPublic: "Публичные кандидаты не получены", webrtcNoCompare: "Нет кандидатов того же семейства", webrtcMatch: "Совпадает с HTTP-выходом", webrtcMismatch: "Не совпадает с HTTP-выходом", exitMatch: "HTTP и WebRTC совпадают", exitMismatch: "HTTP и WebRTC не совпадают", exitUnknown: "Сравнить нельзя", exitExtra: "есть другие выходы: {addresses}", ipv6None: "Публичные IPv6-кандидаты не найдены", ipv6Same: "Совпадает с HTTP-выходом", ipv6Diff: "Не совпадает с HTTP-выходом", ipv6Separate: "Есть отдельный IPv6-выход", ipv6Unknown: "Сравнить нельзя", ipTimezoneMatch: "Совпадает с часовым поясом браузера", ipTimezoneMismatch: "Не совпадает с часовым поясом браузера", latency_low: "низкая задержка", latency_medium: "средняя задержка", latency_high: "высокая задержка", reachabilityTimeout: "Тайм-аут", reachabilityError: "Не завершено", reachabilityAll: "все завершены", reachabilityPartial: "частично завершены", reachabilityNone: "ни один не завершён", reachabilityFastest: "быстрее всего {ms} мс", ipType_datacenter: "дата-центр / облако", ipType_residential: "домашний интернет", ipType_carrier: "сеть оператора", ipType_unknown: "не определено", ipv6EgressMatch: "совпадает с IPv6 HTTP-выходом", ipv6EgressMismatch: "не совпадает с IPv6 HTTP-выходом", ipv6EgressDifferentFamily: "HTTP-выход IPv4, отдельный IPv6-выход", ipv6EgressTimeout: "Тайм-аут IPv6-проверки", ipv6EgressNetwork: "IPv6-соединение не завершено", ipv6EgressInvalid: "Публичный IPv6 не получен" },
    regions: { auto: "Автоопределение", cn: "Китай", hk: "Гонконг", ru: "Россия", ir: "Иран" },
    status: { restricted: "Высокий риск / возможно ограничено", possibly_supported: "Нужно уточнение", unsupported: "Не поддерживается", supported: "Конфликтов не найдено", unknown: "Не подтверждено" },
    risk: { waiting: "Ожидание", checking: "Проверка", supported: "Явных рисков нет", blocked: "Высокий риск среды", high: "Средний риск", light: "Низкий риск", unknown: "Не подтверждено", scoreLabel: "Риск среды" },
    valueMap: { "中国大陆 IP": "IP материкового Китая", "访问和订阅风险极高": "Очень высокий риск доступа и подписки" },
    confidence: { high: "Высокая вероятность", medium: "Возможные признаки", low: "Небольшое совпадение", safe: "Ключевые региональные сигналы не найдены" },
    notEvaluated: "Не проверено",
    coverageLabel: "Оценено сигналов",
    coverageInsufficient: "Часть сигналов не оценена, поэтому риск региона пока нельзя подтвердить.",
    network: {
      toggleLabel: "Проверять сетевой выход (IP / WebRTC / IPv6 / Claude)",
      toggleHint: "Браузер обращается к {provider} за IP, собирает WebRTC-кандидаты через STUN и проверяет edge-диагностику claude.ai, www.anthropic.com, api.anthropic.com и прямой IPv6-выход. Основной сайт claude.ai защищён политикой CORP и недоступен для браузерной проверки. Сайт не проксирует запросы, но эти сторонние сервисы увидят ваш IP.",
      fallbackHint: "Если основной сервис недоступен или ограничил запросы, браузер автоматически обратится к {fallback}; оба сервиса увидят ваш IP.",
      idle: "Сетевой слой: включён. При проверке браузер запросит публичный IP у {provider}, соберёт WebRTC-кандидаты через STUN и напрямую проверит эндпоинты Anthropic и IPv6-сервис; запросы идут напрямую третьим сторонам, сайт не получает и не хранит результат.",
      checking: "Сетевой слой: запрашиваем публичный IP через {provider} и собираем результаты WebRTC, эндпоинтов Anthropic и IPv6…",
      success: "Сетевой слой: публичный IP получен через {provider}, проверки WebRTC, эндпоинтов Anthropic и IPv6 выполнены. Результаты показаны по каждому сигналу; незавершённая проверка не означает недоступность. Запросы отправлены напрямую из браузера; сайт не получает и не хранит их.",
      failed: "Сетевой слой: запрос к {provider} не удался или превысил время ожидания, IP-сигналы пропущены; результаты проверки эндпоинтов Anthropic и IPv6 показываются отдельно. Отсутствие сетевых данных не завышает оценку.",
      disabled: "Сетевой слой: отключён. Проверка использует только сигналы браузера и не отправляет третьим сторонам IP-запросы, STUN, IPv6-запросы или запросы к эндпоинтам Anthropic.",
      unavailable: "Не получено",
      enableAndRetry: "Включить сеть и повторить",
    },
    settings: { label: "Настройки", networkOn: "Сетевой слой вкл.", networkOff: "Сетевой слой выкл.", changeHint: "Смена цели проверки очистит текущий результат; запустите проверку снова." },
    recommendationsTitle: "Рекомендации",
    recommendations: {
      high: "Обнаружено несколько сигналов высокого риска. Если среда отличается от обычного региона аккаунта, не входите и не оформляйте подписку до устранения расхождений.",
      medium: "Есть отдельные региональные сигналы. Проверьте согласованность языка браузера, часового пояса и данных аккаунта; избегайте частой смены сети.",
      low: "Явных сочетаний высокого риска не найдено, но это не гарантирует безопасность аккаунта: учитываются также входы и платежные данные.",
      incomplete: "Часть сигналов недоступна (например, сетевой запрос не удался), вывод может быть неполным. Повторите проверку или используйте популярный браузер.",
      limitation: "Результат основан только на сигналах браузера; сетевой слой отключён, IP и сетевой выход не запрашивались, STUN-запросы не отправлялись. Аккаунт и Cookie не читаются; результат не является решением Anthropic.",
      limitationNetwork: "Результат — эвристика на основе сигналов браузера, геолокации IP от третьей стороны, WebRTC-выхода и завершения запросов к эндпоинтам Anthropic. Для claude.ai проверяется только edge-путь, поэтому доступность входа и подписки не определяется. Аккаунт, Cookie и содержимое ответов не читаются, не все VPN/прокси определяются; результат не является решением Anthropic.",
      limitationNetworkFailed: "Запрос геолокации IP не удался, поэтому результат основан на сигналах браузера, завершении запросов к эндпоинтам Anthropic и прямом IPv6-выходе; для claude.ai проверяется только edge-путь. Отсутствие IP-данных не повышает и не понижает оценку. Аккаунт, Cookie и ответы не читаются; результат не является решением Anthropic.",
    },
    fix: {
      hint: "Браузерная проверка не видит окружение терминала, конфигурацию Claude Code и системные настройки — для дальнейшей проверки и исправления можно использовать локальный клиент.",
      cta: "Исправить в один клик и снизить риск блокировки",
      dialogTitle: "Проверить и исправить локальную среду с CG-Claude",
      dialogDesc: "CG-Claude — сторонний настольный клиент от LcodeCoder для macOS, Windows и Linux. Он проверяет часовой пояс, окружение терминала, настройки браузера и конфигурацию Claude Code, показывает предварительный просмотр изменений и позволяет восстановить резервную копию.",
      dialogNote: "После подтверждения откроется репозиторий GitHub. Скачайте установщик для своей системы в разделе Releases и самостоятельно проверьте источник. CheckCC не скачивает и не устанавливает файлы автоматически и не передаёт результаты этой проверки третьим лицам; эффективность и безопасность стороннего инструмента оценивайте сами.",
      dialogProvider: "Сторонний проект · LcodeCoder/CG-Claude",
      dialogConfirm: "Открыть GitHub",
      dialogCancel: "Отмена",
    },
    report: {
      title: "Отчёт о проверке окружения Claude",
      generatedAt: "Время создания",
      riskScore: "Оценка риска",
      coverage: "Покрытие",
      hitCount: "Совпавшие сигналы",
      status: "Статус",
      region: "Определенный регион",
      target: "Цель проверки",
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
    signalLabels: { timezone: "System timezone", language: "Browser language", languageVariant: "Language variant", chineseFonts: "Regional fonts", vendorFonts: "Vendor fonts", domesticBrowser: "Browser region traits", domesticDevice: "Device region traits", locale: "Intl locale", intlFormat: "Date/number format", timezoneOffset: "Timezone offset", emojiStyle: "Emoji rendering style", country: "IP country", webrtc: "WebRTC egress", exitConsistency: "Egress consistency", ipv6Leak: "WebRTC IPv6 egress", ipTimezone: "IP vs system timezone", ipAddress: "IP address", ipType: "IP type (heuristic)", ipv6Egress: "Direct IPv6 egress", claudeAiReachability: "claude.ai edge reachability", anthropicSiteReachability: "Anthropic site reachability", apiReachability: "API endpoint reachability", anthropicEndpointSummary: "Anthropic endpoint summary", os: "Operating system", browserIpLocation: "IP location", browserIpAsn: "ASN", browserIpOrg: "Network organization", browser: "Browser/app environment", device: "Device/system signals", ipCountryRisk: "IP risk country", claudeAccessRisk: "Claude access risk" },
    signalValues: { unknown: "Unknown", noBrands: "No UA-CH brands", noLanguageVariant: "No key language variant detected", simplifiedChinese: "Simplified Chinese", traditionalChinese: "Traditional Chinese", scFonts: "Simplified Chinese fonts", tcFonts: "Traditional Chinese fonts", noFonts: "No extra Chinese fonts installed", bundledFonts: "Bundled with OS (not scored)", vendorFonts: "Vendor fonts", noVendorFonts: "No vendor fonts detected", noDevice: "No key device traits detected", unknownBrowser: "Unknown browser", unknownSystem: "Unknown system", wechatBrowser: "WeChat in-app browser", androidDevice: "Android device", linuxDevice: "Linux device", appleEmoji: "Apple Emoji style", androidEmoji: "Android / vendor Emoji style", windowsEmoji: "Windows Emoji style", unknownEmoji: "Unknown Emoji style", read: "Read", webrtcUnsupported: "WebRTC not supported", webrtcTimeout: "STUN gathering timed out", webrtcError: "STUN probe failed", webrtcNoPublic: "No public candidates", webrtcNoCompare: "No same-family candidate", webrtcMatch: "Matches HTTP egress", webrtcMismatch: "Differs from HTTP egress", exitMatch: "HTTP and WebRTC egress match", exitMismatch: "HTTP and WebRTC egress differ", exitUnknown: "Cannot compare", exitExtra: "other egress: {addresses}", ipv6None: "No public IPv6 candidates", ipv6Same: "Matches HTTP egress", ipv6Diff: "Differs from HTTP egress", ipv6Separate: "Separate IPv6 egress present", ipv6Unknown: "Cannot compare", ipTimezoneMatch: "Matches browser timezone", ipTimezoneMismatch: "Differs from browser timezone", latency_low: "low latency", latency_medium: "medium latency", latency_high: "high latency", reachabilityTimeout: "Timeout", reachabilityError: "Not completed", reachabilityAll: "all completed", reachabilityPartial: "partially completed", reachabilityNone: "none completed", reachabilityFastest: "fastest {ms} ms", ipType_datacenter: "Datacenter / cloud", ipType_residential: "Residential broadband", ipType_carrier: "Carrier network", ipType_unknown: "Unidentified", ipv6EgressMatch: "matches HTTP IPv6 egress", ipv6EgressMismatch: "differs from HTTP IPv6 egress", ipv6EgressDifferentFamily: "HTTP is IPv4; separate IPv6 egress", ipv6EgressTimeout: "IPv6 probe timed out", ipv6EgressNetwork: "IPv6 connection not completed", ipv6EgressInvalid: "No public IPv6 returned" },
    regions: { auto: "Auto detect", cn: "Mainland China", hk: "Hong Kong", ru: "Russia", ir: "Iran" },
    status: { restricted: "High risk / possibly restricted", possibly_supported: "Needs confirmation", unsupported: "Unsupported", supported: "No regional conflict found", unknown: "Unconfirmed" },
    risk: { waiting: "Waiting", checking: "Checking", supported: "No obvious risk", blocked: "High environment risk", high: "Moderate risk", light: "Light risk", unknown: "Unconfirmed", scoreLabel: "Environment risk" },
    valueMap: { "中国大陆 IP": "Mainland China IP", "访问和订阅风险极高": "Very high access and subscription risk" },
    confidence: { high: "Highly likely", medium: "Likely", low: "Lightly matched", safe: "No key regional signals found" },
    notEvaluated: "Not evaluated",
    coverageLabel: "Evaluated signals",
    coverageInsufficient: "Some signals could not be evaluated, so regional risk cannot be confirmed.",
    network: {
      toggleLabel: "Also check network egress (IP / WebRTC / IPv6 / Claude endpoints)",
      toggleHint: "Your browser queries {provider} for your IP, gathers WebRTC egress through STUN, and probes claude.ai's edge diagnostic path, www.anthropic.com, api.anthropic.com, and direct IPv6 egress. The claude.ai app is protected by a cross-origin policy, so browsers cannot probe it directly. This site does not proxy the requests, but those third parties will see your IP.",
      fallbackHint: "If the primary provider fails or rate-limits the request, the browser automatically tries {fallback}; both providers will see your IP.",
      idle: "Network layer: on. During the check your browser queries {provider} for your public IP, gathers WebRTC candidates through STUN, and contacts Anthropic-related endpoints and an IPv6 probe directly; requests go directly to third parties and this site does not receive or store the results.",
      checking: "Network layer: querying your public IP via {provider} and gathering WebRTC, Anthropic endpoint, and IPv6 egress results…",
      success: "Network layer: public IP retrieved via {provider}, and the WebRTC, Anthropic endpoint, and IPv6 probes were executed. Results are shown per signal; an incomplete probe does not mean the capability is unavailable. Requests were sent directly from your browser; this site does not receive or store them.",
      failed: "Network layer: the {provider} lookup failed or timed out, so IP-based signals were skipped. Anthropic endpoint and direct IPv6 probes are still shown separately. Missing network evidence does not inflate the score.",
      disabled: "Network layer: off. This check uses browser signals only and sent no IP lookup, STUN, IPv6 lookup, or Anthropic endpoint request to a third party.",
      unavailable: "Lookup failed",
      enableAndRetry: "Turn on network and recheck",
    },
    settings: { label: "Check settings", networkOn: "Network on", networkOff: "Network off", changeHint: "Changing the target clears the current result. Run the check again." },
    recommendationsTitle: "Next steps",
    recommendations: {
      high: "Multiple high-risk signals matched. If this environment differs from your account's usual region, avoid signing in or subscribing here until the mismatch is resolved.",
      medium: "Some region-related signals matched. Check that browser language, system timezone, and account details are consistent, and avoid frequent network switching.",
      low: "No clear high-risk combination was found, but this does not guarantee account safety; platform risk controls also consider sign-in behavior and payment details.",
      incomplete: "Some signals could not be evaluated (for example, the network lookup failed), so the conclusion may be incomplete. Retry the check or use a mainstream browser.",
      limitation: "The result uses local browser signals only. The network layer was off, so no IP or network egress data was requested and no STUN request was sent. It does not read your account or cookies and does not represent Anthropic's actual risk decision.",
      limitationNetwork: "The result is a heuristic based on browser signals, third-party IP geolocation, WebRTC egress, and whether Anthropic endpoint requests complete. claude.ai is probed only at its edge path, so sign-in and subscription availability cannot be determined. It does not read your account, cookies, or response content, does not detect every VPN or proxy, and does not represent Anthropic's actual risk decision.",
      limitationNetworkFailed: "The IP geolocation lookup failed, so this run combines browser signals, Anthropic endpoint request completion, and direct IPv6 results; claude.ai is probed only at its edge path. Missing IP evidence does not raise or lower the score; the check does not read your account, cookies, or responses and does not represent Anthropic's actual risk decision.",
    },
    fix: {
      hint: "Browser checks cannot see your terminal environment, Claude Code configuration, or system-level settings. Use a local client to review and fix them.",
      cta: "Fix in one click and reduce ban risk",
      dialogTitle: "Check and fix your local environment with CG-Claude",
      dialogDesc: "CG-Claude is a third-party desktop client from LcodeCoder for macOS, Windows, and Linux. It checks your system time zone, terminal environment, browser settings, and Claude Code configuration, previews changes before applying them, and lets you restore a backup.",
      dialogNote: "Confirming opens the GitHub repository. Download the installer for your system from Releases and verify its source yourself. CheckCC does not download or install anything automatically, does not send these check results to the third party, and makes no guarantee about the tool's effectiveness or security.",
      dialogProvider: "Third-party project · LcodeCoder/CG-Claude",
      dialogConfirm: "Open GitHub",
      dialogCancel: "Cancel",
    },
    report: {
      title: "Claude Environment Check Report",
      generatedAt: "Generated",
      riskScore: "Risk score",
      coverage: "Coverage",
      hitCount: "Matched signals",
      status: "Status",
      region: "Detected region",
      target: "Check target",
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
