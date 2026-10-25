// CheckCC 的多语言文案配置，用于集中维护中文、繁体中文、俄文和英文页面内容。
export type LocaleCode = "zh" | "zh-HK" | "ru" | "en";
export type LocaleSlug = "hong-kong" | "russia" | "en";

export type Messages = {
  nav: { projects: string; faq: string; detect: string; menu: string; close: string; language: string };
  hero: { title: string; subtitle: string };
  logic: { eyebrow: string; title: string; desc: string; items: Array<[string, string, string]> };
  signals: { eyebrow: string; title: string; desc: string; checks: Array<[string, string]> };
  regionsTitle: string;
  regions: Array<{ name: string; risk: string; desc: string }>;
  privacy: { eyebrow: string; title: string; desc: string; items: Array<[string, string]> };
  faq: { title: string; items: Array<[string, string]> };
  footer: { title: string; desc: string; infoTitle: string; domain: string; feature: string; note: string };
  detector: {
    title: string;
    signalCount: (count: number, done: boolean) => string;
    signalHitSummary: (hits: number, total: number) => string;
    targetTitle: string;
    targetDesc: string;
    startCheck: string;

    cardTags: string[];
    loadingText: string;
    idleCta: string;
    idleReport: string;
    environmentSuffix: string;
    riskPrefix: string;
    close: string;
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
];

const zhFaqs: Array<[string, string]> = [
  ["Claude 封号是什么原因？", "快速了解常见封号原因，以及环境画像异常带来的账号风险。"],
  ["Claude 封号原因有哪些？", "梳理 IP、地区、语言、时区、支付方式等常见风险因素。"],
  ["Claude 封号机制是什么？", "从风控信号角度理解账号限制、异常环境和地区画像。"],
  ["Claude 封号后还能解封吗？", "了解账号受限后的处理思路，以及申诉前需要确认的环境问题。"],
  ["Claude 封号会退款吗？", "了解订阅受限后的退款可能性、付款渠道和账号状态影响。"],
  ["如何申请 Claude 账号？", "申请账号前先确认运行环境，减少注册、验证和订阅异常。"],
  ["如何申请 Claude API？", "申请 API 前检查 IP、地区和环境一致性，减少开通风险。"],
  ["Claude Code 怎么申请？", "了解 Claude Code 与 Claude Pro 订阅相关的环境风险。"],
];

const enChecks: Array<[string, string]> = [
  ["Regional profile consistency", "Correlate browser language, Intl locale, system timezone, and localization settings to detect obvious regional conflicts."],
  ["Browser identity profile", "Combine browser language, UA hints, and Intl configuration to check whether browser identity signals agree with each other."],
  ["Device environment fingerprint", "Use fonts, emoji rendering, timezone offset, and other browser traits to check consistency with regional profiles. No hardware identifiers are read."],
  ["Application container detection", "Identify WeChat, QQ, UC, Quark, and other Chinese browser or in-app WebView user-agent markers as weak regional signals."],
  ["Device brand signals", "Detect HarmonyOS, Huawei, Honor, Xiaomi, OPPO, vivo, and similar device-brand clues as weak regional signals."],
  ["Network exit trust", "Optionally checks the IP country, ASN, and network organization to sanity-check network egress. Server request headers are not read, and VPNs or proxies are not detected."],
];

const enFaqs: Array<[string, string]> = [
  ["Why can a Claude account be restricted?", "Learn common restriction reasons and how inconsistent environment profiles can increase account risk."],
  ["What are common Claude restriction factors?", "IP region, language, timezone, payment method, device profile, and network exit consistency are common risk signals."],
  ["How does Claude account risk detection work?", "Risk systems usually evaluate multiple environment and behavior signals instead of a single IP address."],
  ["Can a restricted Claude account be recovered?", "Before appealing, check whether IP, timezone, language, and device signals are consistent and stable."],
  ["Will Claude refund after account restrictions?", "Refund outcomes may depend on subscription state, payment channel, account status, and official policy."],
  ["How should I prepare before creating a Claude account?", "Check your runtime environment first to reduce registration, verification, and subscription issues."],
  ["How should I prepare before applying for Claude API?", "Verify that your IP, region, browser language, and environment profile are consistent before applying."],
  ["How does Claude Code relate to environment risk?", "Claude Code and Claude Pro usage can still be affected by inconsistent account and runtime environment signals."],
];

export const messages: Record<LocaleCode, Messages> = {
  zh: {
    nav: { projects: "检测项目", faq: "FAQ", detect: "立即检测", menu: "菜单", close: "关闭", language: "语言" },
    hero: { title: "检查 Claude 封号风险", subtitle: "AI 环境指纹引擎，综合扫描 Claude 运行环境、地区画像与账号环境风险" },
    logic: {
      eyebrow: "Detection Logic",
      title: "检测原理",
      desc: "我们把 Claude 运行环境拆成可验证的浏览器信号，不依赖单一 IP，而是看语言、时区、设备和本地化配置是否一致。",
      items: [["01", "环境指纹", "系统时区、UTC 偏移、浏览器语言、Intl locale。"], ["02", "网络画像", "可选地由浏览器直连第三方 IP 地理服务，读取 IP 归属国家、ASN 与网络组织；不读取服务端请求头。"], ["03", "风险评分", "按浏览器与网络信号中的地区冲突程度加权汇总，并单独显示可评估覆盖率。"]],
    },
    signals: { eyebrow: "Risk Signals", title: "我们会检测哪些 Claude 风险信号？", desc: "默认使用浏览器信号评分，并可选地加入浏览器直连第三方服务获取的 IP 国家信号。网络层可关闭，查询失败不会抬高分数；未能评估的信号会单独标注，不计入风险分。", checks: zhChecks },
    regionsTitle: "重点地区检测",
    regions: [{ name: "中国大陆", risk: "高风险", desc: "检测简体中文环境、UTC+8 时区、中文字体，以及可选的网络出口国家。" }, { name: "香港", risk: "重点检测", desc: "检测繁体中文环境、UTC+8 时区与浏览器语言特征；香港 IP 不单独计分。" }, { name: "俄罗斯", risk: "高风险", desc: "检测俄语环境、俄罗斯时区，以及可选的网络出口国家。" }],
    privacy: { eyebrow: "Privacy", title: "我们如何保护你的检测隐私？", desc: "CheckCC 只分析完成环境风险评估所需的技术信号，不要求登录 Claude，也不会读取账号敏感内容。", items: [["会上传我的账号数据吗？", "不会。CheckCC 不需要登录 Claude，也不会读取或保存账号、密码、Cookie 等敏感信息。"], ["检测结果会被保存吗？", "不会保存个人检测结果。检测仅用于本次环境风险判断，不会关联你的 Claude 账号。"], ["网站会统计访问数据吗？", "当前版本未接入第三方访问统计脚本，也不会收集 Claude 账号或检测报告内容。"], ["检测过程会分析哪些信号？", "主要分析浏览器环境、语言、时区、地区画像和设备指纹一致性；网络层开启时，还会由浏览器直连第三方 IP 地理服务查询出口 IP、国家、ASN 与网络组织。"]] },
    faq: { title: "Claude 环境检测与封号风险 FAQ", items: zhFaqs },
    footer: { title: "CheckCC 是什么？", desc: "CheckCC.org 是面向 Claude 用户的 AI 环境指纹检测工具，围绕 Claude 环境检测、Claude 封号风险、Claude 运行环境检查、地区画像、网络出口校验和浏览器指纹识别进行综合分析。", infoTitle: "通用信息", domain: "域名：checkcc.org", feature: "功能：Claude 运行环境检测与风险指数报告", note: "说明：检测结果仅供参考，Claude 官方政策与支持地区可能变化" },
    detector: { title: "命中的检测信号", signalCount: (count, done) => done ? `命中${count}个检测信号` : `共展示${count}项`, signalHitSummary: (hits, total) => `命中 ${hits} / 共 ${total} 项`, targetTitle: "选择检测目标", targetDesc: "默认自动检测，也可以指定重点地区。", startCheck: "开始检测", cardTags: ["Claude 环境检测", "Claude 封号风险", "运行环境检查"], loadingText: "正在执行多维度检测...", idleCta: "立即检测 Claude 环境", idleReport: "点击检测，生成 Claude 环境风险报告", environmentSuffix: "环境", riskPrefix: "环境风险", close: "关闭" },
  },
  "zh-HK": {
    nav: { projects: "檢測項目", faq: "FAQ", detect: "立即檢測", menu: "選單", close: "關閉", language: "語言" },
    hero: { title: "檢查 Claude 封號風險", subtitle: "AI 環境指紋引擎，綜合掃描 Claude 運行環境、地區畫像與帳號環境風險" },
    logic: { eyebrow: "Detection Logic", title: "檢測原理", desc: "我們把 Claude 運行環境拆成可驗證的瀏覽器信號，不依賴單一 IP，而是看語言、時區、設備和本地化設定是否一致。", items: [["01", "環境指紋", "系統時區、UTC 偏移、瀏覽器語言、Intl locale。"], ["02", "網絡畫像", "可選地由瀏覽器直連第三方 IP 地理服務，讀取 IP 歸屬國家、ASN 與網絡組織；不讀取服務端請求頭。"], ["03", "風險評分", "按瀏覽器與網絡信號中的地區衝突程度加權匯總，並單獨顯示可評估覆蓋率。"]] },
    signals: { eyebrow: "Risk Signals", title: "我們會檢測哪些 Claude 風險信號？", desc: "預設使用瀏覽器信號評分，並可選地加入瀏覽器直連第三方服務取得的 IP 國家信號。網絡層可關閉，查詢失敗不會抬高風險分；未能評估的信號會單獨標註，不計入風險分。", checks: [["地區畫像一致性", "綜合分析瀏覽器語言、Intl 區域設定、系統時區與本地化設定，判斷是否存在明顯的地區信號衝突。"], ["瀏覽器身份畫像", "結合瀏覽器語言、UA 提示與 Intl 設定，檢查瀏覽器身份信號之間是否相互一致。"], ["終端環境指紋", "透過字體、Emoji 渲染、時區偏移等瀏覽器特徵，檢查設備環境與地區畫像是否一致，不讀取硬件識別碼。"], ["應用容器識別", "識別微信、QQ、UC、夸克等國產瀏覽器與 App 內置 WebView 的 UA 標識，作為地區畫像的弱信號。"], ["設備品牌信號", "識別 HarmonyOS、華為、榮耀、小米、OPPO、vivo 等設備品牌線索，作為地區畫像的弱信號。"], ["網絡出口可信度", "可選地校驗 IP 歸屬國家、ASN 與網絡組織，用於核對網絡出口；不讀取服務端請求頭，也不識別代理或 VPN。"]] },
    regionsTitle: "重點地區檢測",
    regions: [{ name: "中國內地", risk: "高風險", desc: "檢測簡體中文環境、UTC+8 時區、中文字體，以及可選的網絡出口國家。" }, { name: "香港", risk: "重點檢測", desc: "檢測繁體中文環境、UTC+8 時區與瀏覽器語言特徵；香港 IP 不單獨計分。" }, { name: "俄羅斯", risk: "高風險", desc: "檢測俄語環境、俄羅斯時區，以及可選的網絡出口國家。" }],
    privacy: { eyebrow: "Privacy", title: "我們如何保護你的檢測私隱？", desc: "CheckCC 只分析完成環境風險評估所需的技術信號，不要求登入 Claude，也不會讀取帳號敏感內容。", items: [["會上傳我的帳號資料嗎？", "不會。CheckCC 不需要登入 Claude，也不會讀取或保存帳號、密碼、Cookie 等敏感資訊。"], ["檢測結果會被保存嗎？", "不會保存個人檢測結果。檢測僅用於本次環境風險判斷，不會關聯你的 Claude 帳號。"], ["網站會統計訪問資料嗎？", "目前版本未接入第三方訪問統計腳本，也不會收集 Claude 帳號或檢測報告內容。"], ["檢測過程會分析哪些信號？", "主要分析瀏覽器環境、語言、時區、地區畫像和設備指紋一致性；網絡層開啟時，還會由瀏覽器直連第三方 IP 地理服務查詢出口 IP、國家、ASN 與網絡組織。"]] },
    faq: { title: "Claude 環境檢測與封號風險 FAQ", items: [["Claude 封號是甚麼原因？", "快速了解常見封號原因，以及環境畫像異常帶來的帳號風險。"], ["Claude 封號原因有哪些？", "梳理 IP、地區、語言、時區、付款方式等常見風險因素。"], ["Claude 封號機制是甚麼？", "從風控信號角度理解帳號限制、異常環境和地區畫像。"], ["Claude 封號後還能解封嗎？", "了解帳號受限後的處理思路，以及申訴前需要確認的環境問題。"], ["Claude 封號會退款嗎？", "了解訂閱受限後的退款可能性、付款渠道和帳號狀態影響。"], ["如何申請 Claude 帳號？", "申請帳號前先確認運行環境，減少註冊、驗證和訂閱異常。"], ["如何申請 Claude API？", "申請 API 前檢查 IP、地區和環境一致性，減少開通風險。"], ["Claude Code 怎麼申請？", "了解 Claude Code 與 Claude Pro 訂閱相關的環境風險。"]] },
    footer: { title: "CheckCC 是甚麼？", desc: "CheckCC.org 是面向 Claude 用戶的 AI 環境指紋檢測工具，圍繞 Claude 環境檢測、封號風險、地區畫像、網絡出口校驗和瀏覽器指紋識別進行綜合分析。", infoTitle: "通用資訊", domain: "域名：checkcc.org", feature: "功能：Claude 運行環境檢測與風險指數報告", note: "說明：檢測結果僅供參考，Claude 官方政策與支援地區可能變化" },
    detector: { title: "命中的檢測信號", signalCount: (count, done) => done ? `命中${count}個檢測信號` : `共展示${count}項`, signalHitSummary: (hits, total) => `命中 ${hits} / 共 ${total} 項`, targetTitle: "選擇檢測目標", targetDesc: "預設自動檢測，也可以指定重點地區。", startCheck: "開始檢測", cardTags: ["Claude 環境檢測", "Claude 封號風險", "運行環境檢查"], loadingText: "正在執行多維度檢測...", idleCta: "立即檢測 Claude 環境", idleReport: "點擊檢測，生成 Claude 環境風險報告", environmentSuffix: "環境", riskPrefix: "環境風險", close: "關閉" },
  },
  ru: {
    nav: { projects: "Проверки", faq: "FAQ", detect: "Проверить", menu: "Меню", close: "Закрыть", language: "Язык" },
    hero: { title: "Проверьте риск блокировки Claude", subtitle: "AI-движок цифрового профиля анализирует среду Claude, региональные признаки и риск среды аккаунта" },
    logic: { eyebrow: "Detection Logic", title: "Как работает проверка", desc: "Мы разделяем среду Claude на проверяемые сигналы браузера: язык, часовой пояс, устройство и локальные настройки.", items: [["01", "Профиль среды", "Часовой пояс, UTC-смещение, язык браузера и Intl locale."], ["02", "Сетевой профиль", "По желанию браузер напрямую запрашивает у стороннего геосервиса страну IP, ASN и сетевую организацию; заголовки сервера не читаются."], ["03", "Оценка риска", "Взвешенная сумма региональных конфликтов по сигналам браузера и сети с отдельным показом покрытия."]] },
    signals: { eyebrow: "Risk Signals", title: "Какие сигналы риска Claude проверяются?", desc: "По умолчанию оценка идёт по сигналам браузера, а с включённым сетевым слоем добавляется страна IP, полученная браузером напрямую от стороннего сервиса. Сетевой слой можно отключить; неудачный запрос не завышает оценку, а неоценённые сигналы помечаются отдельно и не входят в сумму.", checks: [["Согласованность региона", "Сопоставление языка браузера, Intl locale, часового пояса и локальных настроек для выявления региональных конфликтов."], ["Профиль браузера", "Сопоставление языка браузера, UA-подсказок и Intl-конфигурации для проверки согласованности сигналов."], ["Отпечаток устройства", "Проверка шрифтов, рендеринга Emoji, смещения времени и других признаков браузера на согласованность с региональным профилем. Аппаратные идентификаторы не читаются."], ["Контейнер приложения", "Определение UA-признаков WeChat, QQ, UC, Quark и других китайских браузеров и встроенных WebView как слабых региональных сигналов."], ["Сигналы бренда устройства", "Определение HarmonyOS, Huawei, Honor, Xiaomi, OPPO, vivo и похожих брендов устройства как слабых региональных сигналов."], ["Доверие сетевого выхода", "По желанию проверяются страна IP, ASN и сетевая организация для сверки сетевого выхода; заголовки сервера не читаются, VPN и прокси не определяются."]] },
    regionsTitle: "Ключевые регионы",
    regions: [{ name: "Китай", risk: "Высокий риск", desc: "Проверка упрощённого китайского, часового пояса UTC+8, китайских шрифтов и, по желанию, страны сетевого выхода." }, { name: "Гонконг", risk: "Проверка", desc: "Проверка традиционного китайского, часового пояса UTC+8 и языка браузера; IP Гонконга отдельно не оценивается." }, { name: "Россия", risk: "Высокий риск", desc: "Проверка русского языка, часового пояса России и, по желанию, страны сетевого выхода." }],
    privacy: { eyebrow: "Privacy", title: "Как CheckCC защищает приватность проверки?", desc: "CheckCC анализирует только технические сигналы, необходимые для оценки риска среды. Вход в Claude не требуется, содержимое аккаунта не читается.", items: [["Загружаются ли данные моего аккаунта?", "Нет. CheckCC не требует входа в Claude и не читает логин, пароль, Cookie или другие чувствительные данные аккаунта."], ["Сохраняются ли результаты проверки?", "Персональные результаты не сохраняются. Проверка используется только для текущей оценки риска среды и не связывается с аккаунтом Claude."], ["Используется ли аналитика сайта?", "Текущая версия не подключает сторонние скрипты веб-аналитики и не собирает данные аккаунта Claude или содержимое отчётов."], ["Какие сигналы анализируются?", "В основном анализируются среда браузера, язык, часовой пояс, региональный профиль и согласованность отпечатка устройства. При включённом сетевом слое браузер напрямую запрашивает у стороннего геосервиса IP, страну, ASN и сетевую организацию."]] },
    faq: { title: "Claude Environment & Ban Risk FAQ", items: [["Почему аккаунт Claude может быть заблокирован?", "Кратко о частых причинах блокировок и рисках из-за конфликтного профиля среды."], ["Какие причины блокировки встречаются чаще?", "IP, регион, язык, часовой пояс, способ оплаты и другие сигналы риска."], ["Как работает риск-механика Claude?", "Объяснение ограничений аккаунта через сигналы среды, региона и поведения."], ["Можно ли разблокировать аккаунт Claude?", "Что проверить перед обращением в поддержку и как оценить проблемы среды."], ["Возвращают ли деньги после блокировки?", "Что влияет на возврат: подписка, платежный канал и состояние аккаунта."], ["Как зарегистрировать аккаунт Claude?", "Перед регистрацией стоит проверить среду, чтобы снизить риск ошибок проверки и подписки."], ["Как подать заявку на Claude API?", "Перед API-заявкой проверьте IP, регион и согласованность окружения."], ["Как получить Claude Code?", "Кратко о рисках среды для Claude Code и подписки Claude Pro."]] },
    footer: { title: "Что такое CheckCC?", desc: "CheckCC.org — инструмент проверки цифрового профиля среды Claude: региональные признаки, риск блокировки, сетевой выход и браузерный отпечаток.", infoTitle: "Общая информация", domain: "Домен: checkcc.org", feature: "Функция: проверка среды Claude и отчет о риске", note: "Примечание: результаты справочные, политики Claude и поддерживаемые регионы могут меняться" },
    detector: { title: "Найденные сигналы проверки", signalCount: (count, done) => done ? `Найдено ${count} сигналов` : `Показано ${count} пунктов`, signalHitSummary: (hits, total) => `Совпало ${hits} из ${total}`, targetTitle: "Выберите цель проверки", targetDesc: "По умолчанию используется автоопределение, можно выбрать ключевой регион.", startCheck: "Начать проверку", cardTags: ["Проверка среды Claude", "Риск блокировки Claude", "Проверка окружения"], loadingText: "Выполняется многофакторная проверка...", idleCta: "Проверить среду Claude", idleReport: "Нажмите, чтобы создать отчет о риске среды Claude", environmentSuffix: "среда", riskPrefix: "риск среды", close: "Закрыть" },
  },
  en: {
    nav: { projects: "Checks", faq: "FAQ", detect: "Check now", menu: "Menu", close: "Close", language: "Language" },
    hero: { title: "Check Claude account risk", subtitle: "An AI environment fingerprint engine for scanning Claude runtime signals, regional profiles, and account environment risk" },
    logic: { eyebrow: "Detection Logic", title: "How CheckCC works", desc: "CheckCC breaks the Claude runtime environment into verifiable browser signals: language, timezone, device, and localization settings.", items: [["01", "Environment fingerprint", "System timezone, UTC offset, browser language, and Intl locale."], ["02", "Network profile", "Optionally, the browser queries a third-party IP geolocation service directly for the IP country, ASN, and network organization. Server request headers are not read."], ["03", "Risk scoring", "Weighted regional conflicts across browser and network signals, with evaluation coverage shown separately."]] },
    signals: { eyebrow: "Risk Signals", title: "Which Claude risk signals does CheckCC inspect?", desc: "Scoring uses browser signals by default and can optionally add an IP-country signal retrieved by the browser directly from a third party. The network layer can be turned off; a failed lookup does not inflate the score, and unevaluated signals are labeled and excluded from the total.", checks: enChecks },
    regionsTitle: "Key regions covered",
    regions: [{ name: "Mainland China", risk: "High risk", desc: "Checks Simplified Chinese traits, UTC+8 timezone, Chinese fonts, and the optional network-exit country." }, { name: "Hong Kong", risk: "Focused check", desc: "Checks Traditional Chinese traits, UTC+8 timezone, and browser language signals; Hong Kong IPs are not scored separately." }, { name: "Russia", risk: "High risk", desc: "Checks Russian language traits, Russia timezone, and the optional network-exit country." }],
    privacy: { eyebrow: "Privacy", title: "How does CheckCC protect your privacy?", desc: "CheckCC only analyzes technical signals needed for environment risk evaluation. It does not require Claude login and does not read sensitive account content.", items: [["Will my Claude account data be uploaded?", "No. CheckCC does not require Claude login and does not read or store account names, passwords, cookies, or other sensitive data."], ["Are detection results saved?", "No personal detection results are saved. The check is only used for the current environment risk evaluation and is not linked to your Claude account."], ["Does the website use analytics?", "The current version does not load third-party analytics scripts and does not collect Claude account data or report content."], ["Which signals are analyzed?", "CheckCC mainly analyzes browser environment, language, timezone, regional profile, and device fingerprint consistency. With the network layer on, the browser also queries a third-party IP geolocation service directly for the exit IP, country, ASN, and network organization."]] },
    faq: { title: "Claude environment and account risk FAQ", items: enFaqs },
    footer: { title: "What is CheckCC?", desc: "CheckCC.org is an AI environment fingerprint checker for Claude users. It analyzes Claude environment signals, account restriction risk, runtime consistency, regional profiles, network exits, and browser fingerprints.", infoTitle: "General information", domain: "Domain: checkcc.org", feature: "Feature: Claude runtime environment check and risk index report", note: "Note: results are for reference only. Claude policies and supported regions may change." },
    detector: { title: "Detected signals", signalCount: (count, done) => done ? `${count} detected signals` : `${count} items shown`, signalHitSummary: (hits, total) => `${hits} of ${total} matched`, targetTitle: "Select check target", targetDesc: "Auto detection is used by default. You can also select a key region.", startCheck: "Start check", cardTags: ["Claude environment check", "Claude account risk", "Runtime environment scan"], loadingText: "Running multi-factor detection...", idleCta: "Check Claude environment now", idleReport: "Click to generate a Claude environment risk report", environmentSuffix: "environment", riskPrefix: "environment risk", close: "Close" },
  },
};

export function getLocaleBySlug(slug?: string): LocaleCode | null {
  if (!slug) return defaultLocale;
  return slug === "hong-kong" || slug === "russia" || slug === "en" ? slugToLocale[slug] : null;
}
