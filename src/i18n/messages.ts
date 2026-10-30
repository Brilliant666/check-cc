// CheckCC 的多语言文案配置，用于集中维护中文、繁体中文、俄文和英文页面内容。
import { enFaqs, ruFaqs, zhFaqs, zhHkFaqs } from "./faqs";
export type LocaleCode = "zh" | "zh-HK" | "ru" | "en";
export type LocaleSlug = "hong-kong" | "russia" | "en";

export type Messages = {
  nav: { projects: string; faq: string; detect: string; menu: string; close: string; language: string };
  hero: { title: string; subtitle: string };
  logic: { eyebrow: string; title: string; desc: string; items: Array<[string, string, string]> };
  // descNetworkOn replaces desc when the site is built with the network layer on by default.
  signals: { eyebrow: string; title: string; desc: string; descNetworkOn: string; checks: Array<[string, string]> };
  regionsTitle: string;
  regions: Array<{ name: string; risk: string; desc: string }>;
  privacy: { eyebrow: string; title: string; desc: string; items: Array<[string, string]> };
  faq: { title: string; items: Array<[string, string]> };
  footer: { title: string; desc: string; infoTitle: string; feature: string; note: string; credit: string; related: string };
  detector: {
    title: string;
    signalCount: (count: number, done: boolean) => string;
    signalHitSummary: (hits: number, total: number) => string;
    targetTitle: string;
    targetDesc: string;

    cardTags: string[];
    loadingText: string;
    idleCta: string;
    idleReport: string;
    riskPrefix: string;
  };
};

export const defaultLocale: LocaleCode = "zh";

export const localeRoutes: Record<LocaleCode, { slug: LocaleSlug | ""; label: string; lang: string }> = {
  zh: { slug: "", label: "中国", lang: "中文" },
  "zh-HK": { slug: "hong-kong", label: "香港", lang: "繁中" },
  ru: { slug: "russia", label: "俄罗斯", lang: "Русский" },
  en: { slug: "en", label: "Global", lang: "English" },
};

export const slugToLocale: Record<LocaleSlug, LocaleCode> = {
  "hong-kong": "zh-HK",
  russia: "ru",
  en: "en",
};

const zhChecks: Array<[string, string]> = [
  ["地区画像一致性", "综合分析浏览器语言、Intl 区域设置、系统时区与本地化配置，判断是否存在明显的地区信号冲突。"],
  ["浏览器身份画像", "结合浏览器语言、UA 提示与 Intl 配置，检查浏览器身份信号之间是否相互一致。"],
  ["终端环境指纹", "通过字体、Emoji 渲染、时区偏移等浏览器特征，检查设备环境与地区画像是否一致，不读取硬件标识。"],
  ["应用容器识别", "识别微信、QQ、UC、夸克等国产浏览器与 App 内置 WebView 的 UA 标识，作为地区画像的弱信号。"],
  ["设备品牌信号", "识别 HarmonyOS、华为、荣耀、小米、OPPO、vivo 等设备品牌线索，作为地区画像的弱信号。"],
  ["网络出口可信度", "可选地校验 IP 归属国家、ASN 与网络组织，用于核对网络出口；不读取服务端请求头，也不识别代理或 VPN。"],
  ["Claude 端点可达性", "可选地由浏览器直连 claude.ai 的 Cloudflare 边缘诊断路径、www.anthropic.com 与 api.anthropic.com，只观察请求是否完成及耗时，不读取响应内容；claude.ai 主站受跨域策略保护，无法直接探测。"],
  ["双栈出口核对", "可选地通过 IPv6 专用查询服务读取直连出口，并与 HTTP 出口做同协议族比较；地址族不同不视为泄漏。"],
  ["出口类型启发式", "根据 ASN 与网络组织名称提示住宅宽带、运营商、数据中心或未知类型，仅作上下文参考，不参与评分。"],
];

const enChecks: Array<[string, string]> = [
  ["Regional profile consistency", "Correlate browser language, Intl locale, system timezone, and localization settings to detect obvious regional conflicts."],
  ["Browser identity profile", "Combine browser language, UA hints, and Intl configuration to check whether browser identity signals agree with each other."],
  ["Device environment fingerprint", "Use fonts, emoji rendering, timezone offset, and other browser traits to check consistency with regional profiles. No hardware identifiers are read."],
  ["Application container detection", "Identify WeChat, QQ, UC, Quark, and other Chinese browser or in-app WebView user-agent markers as weak regional signals."],
  ["Device brand signals", "Detect HarmonyOS, Huawei, Honor, Xiaomi, OPPO, vivo, and similar device-brand clues as weak regional signals."],
  ["Network exit trust", "Optionally checks the IP country, ASN, and network organization to sanity-check network egress. Server request headers are not read, and VPNs or proxies are not detected."],
  ["Claude endpoint reachability", "Optionally contacts claude.ai's Cloudflare edge diagnostic path, www.anthropic.com, and api.anthropic.com directly from the browser. Only completion and latency are observed; response content is not read. The claude.ai app is protected by a cross-origin policy and cannot be probed directly."],
  ["Dual-stack egress check", "Optionally reads the direct IPv6 exit from an IPv6-only lookup service and compares it with the HTTP exit in the same address family. A different family is not treated as a leak."],
  ["Egress type heuristic", "Uses ASN and network organization names to label residential broadband, carrier, datacenter, or unknown egress. This is context only and never affects the score."],
];

export const messages: Record<LocaleCode, Messages> = {
  zh: {
    nav: { projects: "检测项目", faq: "FAQ", detect: "立即检测", menu: "菜单", close: "关闭", language: "语言" },
    hero: { title: "检查 Claude 封号风险", subtitle: "浏览器环境指纹引擎，综合扫描 Claude 运行环境、地区画像与账号环境风险" },
    logic: {
      eyebrow: "Detection Logic",
      title: "检测原理",
      desc: "我们把 Claude 运行环境拆成可验证的浏览器信号，不依赖单一 IP，而是看语言、时区、设备和本地化配置是否一致。",
      items: [["01", "环境指纹", "系统时区、UTC 偏移、浏览器语言、Intl locale、日期/数字格式。"], ["02", "网络画像", "可选地由浏览器直连第三方 IP 地理服务与 IPv6 查询服务，读取 IP 归属国家、ASN、网络组织与双栈出口；不读取服务端请求头。"], ["03", "风险评分", "按浏览器与网络信号中的地区冲突程度加权汇总，并单独显示可评估覆盖率。"]],
    },
    signals: { eyebrow: "Risk Signals", title: "我们会检测哪些 Claude 风险信号？", desc: "默认使用浏览器信号评分，网络层默认关闭；开启后浏览器会直连第三方 IP 地理服务、STUN、Anthropic 相关端点与 IPv6 查询服务。查询失败不会抬高分数；未能评估的信号会单独标注，不计入风险分。", descNetworkOn: "本站默认开启网络层：检测时浏览器会直连第三方 IP 地理服务、STUN、Anthropic 相关端点与 IPv6 查询服务，这些服务会看到你的 IP。可以在检测设置里关闭，只使用浏览器信号。查询失败不会抬高分数；未能评估的信号会单独标注，不计入风险分。", checks: zhChecks },
    regionsTitle: "重点地区检测",
    regions: [{ name: "中国大陆", risk: "高风险", desc: "检测简体中文环境、UTC+8 时区、中文字体，以及可选的网络出口国家。" }, { name: "香港", risk: "重点检测", desc: "自动检测会结合繁体中文、香港时区与浏览器语言识别香港，并使用独立画像；开启网络层时，香港 IP 会单独核验。" }, { name: "俄罗斯", risk: "高风险", desc: "检测俄语环境、俄罗斯时区，以及可选的网络出口国家。" }],
    privacy: { eyebrow: "Privacy", title: "我们如何保护你的检测隐私？", desc: "CheckCC 只分析完成环境风险评估所需的技术信号，不要求登录 Claude，也不会读取账号敏感内容。", items: [["会上传我的账号数据吗？", "不会。CheckCC 不需要登录 Claude，也不会读取或保存账号、密码、Cookie 等敏感信息。"], ["检测结果会被保存吗？", "不会保存个人检测结果。检测仅用于本次环境风险判断，不会关联你的 Claude 账号。"], ["网站会统计访问数据吗？", "当前版本未接入第三方访问统计脚本，也不会收集 Claude 账号或检测报告内容。"], ["检测过程会分析哪些信号？", "主要分析浏览器环境、语言、时区、地区画像和设备指纹一致性；网络层开启时，还会由浏览器直连第三方 IP 地理服务查询出口 IP、国家、ASN 与网络组织，直连 STUN 收集 WebRTC 候选，并请求 claude.ai 边缘诊断路径、www.anthropic.com、api.anthropic.com 与 IPv6 查询服务。端点探测不读取响应内容。"]] },
    faq: { title: "Claude 环境检测与封号风险 FAQ", items: zhFaqs },
    footer: { title: "CheckCC 是什么？", desc: "CheckCC 是面向 Claude 用户的浏览器环境检测工具，围绕 Claude 环境检测、Claude 封号风险、Claude 运行环境检查、地区画像、网络出口校验和浏览器环境特征进行分析。", infoTitle: "通用信息", feature: "功能：Claude 运行环境检测与风险指数报告", note: "说明：检测结果仅供参考，Claude 官方政策与支持地区可能变化", credit: "本项目基于 yacuo/check-cc 的 MIT 许可代码构建。", related: "第三方工具" },
    detector: { title: "命中的检测信号", signalCount: (count, done) => done ? `命中${count}个检测信号` : `共展示${count}项`, signalHitSummary: (hits, total) => `命中 ${hits} / 共 ${total} 项`, targetTitle: "选择检测目标", targetDesc: "默认自动检测，也可以指定中国大陆或俄罗斯；香港环境由自动检测画像单独识别。", cardTags: ["Claude 环境检测", "Claude 封号风险", "运行环境检查"], loadingText: "正在执行多维度检测...", idleCta: "立即检测 Claude 环境", idleReport: "点击检测，生成 Claude 环境风险报告", riskPrefix: "环境风险" },
  },
  "zh-HK": {
    nav: { projects: "檢測項目", faq: "FAQ", detect: "立即檢測", menu: "選單", close: "關閉", language: "語言" },
    hero: { title: "檢查 Claude 封號風險", subtitle: "瀏覽器環境指紋引擎，綜合掃描 Claude 運行環境、地區畫像與帳號環境風險" },
    logic: { eyebrow: "Detection Logic", title: "檢測原理", desc: "我們把 Claude 運行環境拆成可驗證的瀏覽器信號，不依賴單一 IP，而是看語言、時區、設備和本地化設定是否一致。", items: [["01", "環境指紋", "系統時區、UTC 偏移、瀏覽器語言、Intl locale、日期/數字格式。"], ["02", "網絡畫像", "可選地由瀏覽器直連第三方 IP 地理服務與 IPv6 查詢服務，讀取 IP 歸屬國家、ASN、網絡組織與雙棧出口；不讀取服務端請求頭。"], ["03", "風險評分", "按瀏覽器與網絡信號中的地區衝突程度加權匯總，並單獨顯示可評估覆蓋率。"]] },
    signals: { eyebrow: "Risk Signals", title: "我們會檢測哪些 Claude 風險信號？", desc: "預設使用瀏覽器信號評分，網絡層預設關閉；開啟後瀏覽器會直連第三方 IP 地理服務、STUN、Anthropic 相關端點與 IPv6 查詢服務。查詢失敗不會抬高風險分；未能評估的信號會單獨標註，不計入風險分。", descNetworkOn: "本站預設開啟網絡層：檢測時瀏覽器會直連第三方 IP 地理服務、STUN、Anthropic 相關端點與 IPv6 查詢服務，這些服務會看到你的 IP。可以在檢測設定裡關閉，只使用瀏覽器信號。查詢失敗不會抬高風險分；未能評估的信號會單獨標註，不計入風險分。", checks: [["地區畫像一致性", "綜合分析瀏覽器語言、Intl 區域設定、系統時區與本地化設定，判斷是否存在明顯的地區信號衝突。"], ["瀏覽器身份畫像", "結合瀏覽器語言、UA 提示與 Intl 設定，檢查瀏覽器身份信號之間是否相互一致。"], ["終端環境指紋", "透過字體、Emoji 渲染、時區偏移等瀏覽器特徵，檢查設備環境與地區畫像是否一致，不讀取硬件識別碼。"], ["應用容器識別", "識別微信、QQ、UC、夸克等國產瀏覽器與 App 內置 WebView 的 UA 標識，作為地區畫像的弱信號。"], ["設備品牌信號", "識別 HarmonyOS、華為、榮耀、小米、OPPO、vivo 等設備品牌線索，作為地區畫像的弱信號。"], ["網絡出口可信度", "可選地校驗 IP 歸屬國家、ASN 與網絡組織，用於核對網絡出口；不讀取服務端請求頭，也不識別代理或 VPN。"], ["Claude 端點可達性", "可選地由瀏覽器直連 claude.ai 的 Cloudflare 邊緣診斷路徑、www.anthropic.com 與 api.anthropic.com，只觀察請求是否完成及耗時，不讀取回應內容；claude.ai 主站受跨域策略保護，無法直接探測。"], ["雙棧出口核對", "可選地透過 IPv6 專用查詢服務讀取直連出口，並與 HTTP 出口做同協議族比較；地址族不同不視為洩漏。"], ["出口類型啟發式", "根據 ASN 與網絡組織名稱提示住宅寬頻、營運商、數據中心或未知類型，僅作上下文參考，不參與評分。"]] },
    regionsTitle: "重點地區檢測",
    regions: [{ name: "中國內地", risk: "高風險", desc: "檢測簡體中文環境、UTC+8 時區、中文字體，以及可選的網絡出口國家。" }, { name: "香港", risk: "重點檢測", desc: "自動檢測會結合繁體中文、香港時區與瀏覽器語言識別香港，並使用獨立畫像；開啟網絡層時，香港 IP 會單獨核驗。" }, { name: "俄羅斯", risk: "高風險", desc: "檢測俄語環境、俄羅斯時區，以及可選的網絡出口國家。" }],
    privacy: { eyebrow: "Privacy", title: "我們如何保護你的檢測私隱？", desc: "CheckCC 只分析完成環境風險評估所需的技術信號，不要求登入 Claude，也不會讀取帳號敏感內容。", items: [["會上傳我的帳號資料嗎？", "不會。CheckCC 不需要登入 Claude，也不會讀取或保存帳號、密碼、Cookie 等敏感資訊。"], ["檢測結果會被保存嗎？", "不會保存個人檢測結果。檢測僅用於本次環境風險判斷，不會關聯你的 Claude 帳號。"], ["網站會統計訪問資料嗎？", "目前版本未接入第三方訪問統計腳本，也不會收集 Claude 帳號或檢測報告內容。"], ["檢測過程會分析哪些信號？", "主要分析瀏覽器環境、語言、時區、地區畫像和設備指紋一致性；網絡層開啟時，還會由瀏覽器直連第三方 IP 地理服務查詢出口 IP、國家、ASN 與網絡組織，直連 STUN 收集 WebRTC 候選，並請求 claude.ai 邊緣診斷路徑、www.anthropic.com、api.anthropic.com 與 IPv6 查詢服務。端點探測不讀取回應內容。"]] },
    faq: { title: "Claude 環境檢測與封號風險 FAQ", items: zhHkFaqs },
    footer: { title: "CheckCC 是甚麼？", desc: "CheckCC 是面向 Claude 用戶的瀏覽器環境檢測工具，圍繞 Claude 環境檢測、封號風險、地區畫像、網絡出口校驗和瀏覽器環境特徵進行綜合分析。", infoTitle: "通用資訊", feature: "功能：Claude 運行環境檢測與風險指數報告", note: "說明：檢測結果僅供參考，Claude 官方政策與支援地區可能變化", credit: "本項目基於 yacuo/check-cc 的 MIT 許可程式碼構建。", related: "第三方工具" },
    detector: { title: "命中的檢測信號", signalCount: (count, done) => done ? `命中${count}個檢測信號` : `共展示${count}項`, signalHitSummary: (hits, total) => `命中 ${hits} / 共 ${total} 項`, targetTitle: "選擇檢測目標", targetDesc: "預設自動檢測，也可以指定中國內地或俄羅斯；香港環境由自動檢測畫像單獨識別。", cardTags: ["Claude 環境檢測", "Claude 封號風險", "運行環境檢查"], loadingText: "正在執行多維度檢測...", idleCta: "立即檢測 Claude 環境", idleReport: "點擊檢測，生成 Claude 環境風險報告", riskPrefix: "環境風險" },
  },
  ru: {
    nav: { projects: "Проверки", faq: "FAQ", detect: "Проверить", menu: "Меню", close: "Закрыть", language: "Язык" },
    hero: { title: "Проверьте риск блокировки Claude", subtitle: "Движок цифрового профиля среды анализирует среду Claude, региональные признаки и риск среды аккаунта" },
    logic: { eyebrow: "Detection Logic", title: "Как работает проверка", desc: "Мы разделяем среду Claude на проверяемые сигналы браузера: язык, часовой пояс, устройство и локальные настройки.", items: [["01", "Профиль среды", "Часовой пояс, UTC-смещение, язык браузера, Intl locale, формат даты и чисел."], ["02", "Сетевой профиль", "По желанию браузер напрямую обращается к стороннему геосервису и сервису IPv6-запросов, получая страну IP, ASN, сетевую организацию и данные двойного стека; заголовки сервера не читаются."], ["03", "Оценка риска", "Взвешенная сумма региональных конфликтов по сигналам браузера и сети с отдельным показом покрытия."]] },
    signals: { eyebrow: "Risk Signals", title: "Какие сигналы риска Claude проверяются?", desc: "По умолчанию оценка идёт по сигналам браузера; сетевой слой по умолчанию отключён. При включении браузер напрямую обращается к стороннему геосервису, STUN, эндпоинтам Anthropic (edge claude.ai, сайт и API) и сервису IPv6-запросов. Неудачный запрос не завышает оценку, а неоценённые сигналы помечаются отдельно и не входят в сумму.", descNetworkOn: "На этом сайте сетевой слой включён по умолчанию: при проверке браузер напрямую обращается к стороннему геосервису, STUN, эндпоинтам Anthropic (edge claude.ai, сайт и API) и сервису IPv6-запросов, и эти сервисы видят ваш IP. Его можно отключить в настройках проверки и оставить только сигналы браузера. Неудачный запрос не завышает оценку, а неоценённые сигналы помечаются отдельно и не входят в сумму.", checks: [["Согласованность региона", "Сопоставление языка браузера, Intl locale, часового пояса и локальных настроек для выявления региональных конфликтов."], ["Профиль браузера", "Сопоставление языка браузера, UA-подсказок и Intl-конфигурации для проверки согласованности сигналов."], ["Отпечаток устройства", "Проверка шрифтов, рендеринга Emoji, смещения времени и других признаков браузера на согласованность с региональным профилем. Аппаратные идентификаторы не читаются."], ["Контейнер приложения", "Определение UA-признаков WeChat, QQ, UC, Quark и других китайских браузеров и встроенных WebView как слабых региональных сигналов."], ["Сигналы бренда устройства", "Определение HarmonyOS, Huawei, Honor, Xiaomi, OPPO, vivo и похожих брендов устройства как слабых региональных сигналов."], ["Доверие сетевого выхода", "По желанию проверяются страна IP, ASN и сетевая организация для сверки сетевого выхода; заголовки сервера не читаются, VPN и прокси не определяются."], ["Доступность эндпоинтов Claude", "По желанию браузер напрямую обращается к edge-диагностике claude.ai, www.anthropic.com и api.anthropic.com и фиксирует только факт завершения запроса и задержку, не читая содержимое ответа. Основной сайт claude.ai защищён политикой CORP и недоступен для прямой браузерной проверки."], ["Проверка двойного стека", "По желанию сервис IPv6-запросов показывает прямой IPv6-выход, который сравнивается с HTTP-выходом в пределах одного семейства адресов; разные семейства не считаются утечкой."], ["Эвристика типа выхода", "По ASN и названию организации определяется жилой провайдер, оператор связи, дата-центр или неизвестный тип; это только контекст, не влияет на оценку."]] },
    regionsTitle: "Ключевые регионы",
    regions: [{ name: "Китай", risk: "Высокий риск", desc: "Проверка упрощённого китайского, часового пояса UTC+8, китайских шрифтов и, по желанию, страны сетевого выхода." }, { name: "Гонконг", risk: "Отдельная проверка", desc: "Автопроверка распознаёт Гонконг по традиционному китайскому, часовому поясу и языку браузера и использует отдельный профиль; при включённом сетевом слое IP Гонконга проверяется отдельно." }, { name: "Россия", risk: "Высокий риск", desc: "Проверка русского языка, часового пояса России и, по желанию, страны сетевого выхода." }],
    privacy: { eyebrow: "Privacy", title: "Как CheckCC защищает приватность проверки?", desc: "CheckCC анализирует только технические сигналы, необходимые для оценки риска среды. Вход в Claude не требуется, содержимое аккаунта не читается.", items: [["Загружаются ли данные моего аккаунта?", "Нет. CheckCC не требует входа в Claude и не читает логин, пароль, Cookie или другие чувствительные данные аккаунта."], ["Сохраняются ли результаты проверки?", "Персональные результаты не сохраняются. Проверка используется только для текущей оценки риска среды и не связывается с аккаунтом Claude."], ["Используется ли аналитика сайта?", "Текущая версия не подключает сторонние скрипты веб-аналитики и не собирает данные аккаунта Claude или содержимое отчётов."], ["Какие сигналы анализируются?", "В основном анализируются среда браузера, язык, часовой пояс, региональный профиль и согласованность отпечатка устройства. При включённом сетевом слое браузер напрямую запрашивает у стороннего геосервиса IP, страну, ASN и сетевую организацию, подключается к STUN для сбора WebRTC-кандидатов, а также обращается к edge-диагностике claude.ai, www.anthropic.com, api.anthropic.com и сервису IPv6-запросов. При проверке эндпоинтов содержимое ответов не читается."]] },
    faq: { title: "FAQ по среде Claude и риску блокировки", items: ruFaqs },
    footer: { title: "Что такое CheckCC?", desc: "CheckCC — инструмент проверки цифрового профиля среды Claude: региональные признаки, риск блокировки, сетевой выход и браузерные признаки среды.", infoTitle: "Общая информация", feature: "Функция: проверка среды Claude и отчет о риске", note: "Примечание: результаты справочные, политики Claude и поддерживаемые регионы могут меняться", credit: "Проект основан на коде yacuo/check-cc под лицензией MIT.", related: "Сторонний инструмент" },
    detector: { title: "Найденные сигналы проверки", signalCount: (count, done) => done ? `Найдено ${count} сигналов` : `Показано ${count} пунктов`, signalHitSummary: (hits, total) => `Совпало ${hits} из ${total}`, targetTitle: "Выберите цель проверки", targetDesc: "По умолчанию используется автоопределение; можно выбрать Китай или Россию. Гонконг определяется отдельным профилем.", cardTags: ["Проверка среды Claude", "Риск блокировки Claude", "Проверка окружения"], loadingText: "Выполняется многофакторная проверка...", idleCta: "Проверить среду Claude", idleReport: "Нажмите, чтобы создать отчет о риске среды Claude", riskPrefix: "риск среды" },
  },
  en: {
    nav: { projects: "Checks", faq: "FAQ", detect: "Check now", menu: "Menu", close: "Close", language: "Language" },
    hero: { title: "Check Claude account risk", subtitle: "A browser environment fingerprint engine for scanning Claude runtime signals, regional profiles, and account environment risk" },
    logic: { eyebrow: "Detection Logic", title: "How CheckCC works", desc: "CheckCC breaks the Claude runtime environment into verifiable browser signals: language, timezone, device, and localization settings.", items: [["01", "Environment fingerprint", "System timezone, UTC offset, browser language, Intl locale, and date/number formats."], ["02", "Network profile", "Optionally, the browser connects directly to a third-party IP geolocation service and an IPv6 lookup service for the IP country, ASN, network organization, and dual-stack egress. Server request headers are not read."], ["03", "Risk scoring", "Weighted regional conflicts across browser and network signals, with evaluation coverage shown separately."]] },
    signals: { eyebrow: "Risk Signals", title: "Which Claude risk signals does CheckCC inspect?", desc: "Scoring uses browser signals by default; the network layer is off by default. When enabled, the browser connects directly to third-party IP geolocation, STUN, Anthropic-related endpoints, and an IPv6 lookup service. A failed lookup does not inflate the score, and unevaluated signals are labeled and excluded from the total.", descNetworkOn: "This site turns the network layer on by default: during a check, your browser connects directly to third-party IP geolocation, STUN, Anthropic-related endpoints, and an IPv6 lookup service, and those services see your IP. You can turn it off in the check settings to use browser signals only. A failed lookup does not inflate the score, and unevaluated signals are labeled and excluded from the total.", checks: enChecks },
    regionsTitle: "Key regions covered",
    regions: [{ name: "Mainland China", risk: "High risk", desc: "Checks Simplified Chinese traits, UTC+8 timezone, Chinese fonts, and the optional network-exit country." }, { name: "Hong Kong", risk: "Focused check", desc: "Auto detection identifies Hong Kong from Traditional Chinese, timezone, and browser-language traits and uses a separate profile; with the network layer on, Hong Kong IPs are checked separately." }, { name: "Russia", risk: "High risk", desc: "Checks Russian language traits, Russia timezone, and the optional network-exit country." }],
    privacy: { eyebrow: "Privacy", title: "How does CheckCC protect your privacy?", desc: "CheckCC only analyzes technical signals needed for environment risk evaluation. It does not require Claude login and does not read sensitive account content.", items: [["Will my Claude account data be uploaded?", "No. CheckCC does not require Claude login and does not read or store account names, passwords, cookies, or other sensitive data."], ["Are detection results saved?", "No personal detection results are saved. The check is only used for the current environment risk evaluation and is not linked to your Claude account."], ["Does the website use analytics?", "The current version does not load third-party analytics scripts and does not collect Claude account data or report content."], ["Which signals are analyzed?", "CheckCC mainly analyzes browser environment, language, timezone, regional profile, and device fingerprint consistency. With the network layer on, the browser also queries a third-party IP geolocation service directly for the exit IP, country, ASN, and network organization, connects directly to STUN to collect WebRTC candidates, and requests claude.ai's edge diagnostic path, www.anthropic.com, api.anthropic.com, and an IPv6 lookup service. Endpoint probes do not read response content."]] },
    faq: { title: "Claude environment and account risk FAQ", items: enFaqs },
    footer: { title: "What is CheckCC?", desc: "CheckCC is a browser environment fingerprint checker for Claude users. It analyzes Claude environment signals, account restriction risk, runtime consistency, regional profiles, network exits, and browser environment traits.", infoTitle: "General information", feature: "Feature: Claude runtime environment check and risk index report", note: "Note: results are for reference only. Claude policies and supported regions may change.", credit: "Based on MIT-licensed code from yacuo/check-cc.", related: "Third-party tool" },
    detector: { title: "Detected signals", signalCount: (count, done) => done ? `${count} detected signals` : `${count} items shown`, signalHitSummary: (hits, total) => `${hits} of ${total} matched`, targetTitle: "Select check target", targetDesc: "Auto detection is used by default. You can also select Mainland China or Russia; Hong Kong environments are identified by a separate auto profile.", cardTags: ["Claude environment check", "Claude account risk", "Runtime environment scan"], loadingText: "Running multi-factor detection...", idleCta: "Check Claude environment now", idleReport: "Click to generate a Claude environment risk report", riskPrefix: "environment risk" },
  },
};

export function getLocaleBySlug(slug?: string): LocaleCode | null {
  if (!slug) return defaultLocale;
  return slug === "hong-kong" || slug === "russia" || slug === "en" ? slugToLocale[slug] : null;
}
