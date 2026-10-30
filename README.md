<!-- CheckCC 中文项目说明：面向开源用户介绍项目用途、检测能力边界、开发方式与部署方式。 -->
# CheckCC

<p align="center">
  <strong>检查 Claude 封号风险，先看清浏览器环境画像</strong>
</p>

<p align="center">
  浏览器端环境指纹检测 · 中国大陆 / 香港 / 俄罗斯 / 伊朗画像 · 可选网络层（STUN / IPv6 / 端点可达性） · 静态自托管
</p>

<p align="center">
  <a href="#项目简介">项目简介</a> ·
  <a href="#页面预览">页面预览</a> ·
  <a href="#功能详解">功能详解</a> ·
  <a href="#快速开始">快速开始</a> ·
  <a href="#自部署">自部署</a> ·
  <a href="README.en.md">English</a>
</p>

---

## 📖 项目简介

**CheckCC** 是一个浏览器端的 Claude 环境检测工具，用来发现系统时区、浏览器语言、Intl 区域、字体、设备特征和网络出口之间的明显冲突。它不登录 Claude，不读取账号、Cookie 或聊天内容，也不把检测结果上传到服务器。

本仓库是 [yacuo/check-cc](https://github.com/yacuo/check-cc) 的社区分支，由 [Brilliant666](https://github.com/Brilliant666) 维护。当前分支重点修正了检测结论的可信度：未评估的信号不再按 0 分处理，报告会显示可评估覆盖率；网络层默认关闭、可按需开启；香港环境使用独立画像，不再归入中国大陆画像；开启网络层后可额外核验 WebRTC 出口、双栈 IPv6 出口、Claude 端点可达性与 IP 时区是否一致。新增的直连探测都只提供上下文，不改变加权评分。

> 检测结果是启发式风险提示，不代表 Claude 或 Anthropic 的官方判断，也不能证明账号一定会被限制。

### ✨ 核心特性

- 🔍 **10 项浏览器加权信号**：系统时区、浏览器语言、语言文字、地区字体、厂商字体、浏览器地区特征、设备地区特征、Intl 区域、时区偏移、Emoji 渲染风格。
- 🇭🇰 **中国大陆 / 香港 / 俄罗斯 / 伊朗画像**：自动检测分别匹配；繁体中文、香港时区和 `zh-HK` 语言环境会显示为香港，而不是中国大陆。
- 🌐 **可选网络层**：默认关闭；完成浏览器检测后，可以点击“开启网络层并重测”，由浏览器直连第三方 IP 地理服务补充 IP 国家信号。
- 🧭 **WebRTC 出口核验**：网络层开启时通过 STUN 收集 ICE 候选，比较 WebRTC 出口与 HTTP 出口是否一致，并单独报告 WebRTC IPv6 出口和 IP 时区差异；探测失败只降低覆盖率，不会抬高或压低风险分。
- 🛰️ **Claude 端点可达性**：网络层开启时由浏览器直连 `claude.ai` 的 Cloudflare 边缘诊断路径、`www.anthropic.com` 与 `api.anthropic.com`，只记录请求是否完成和耗时，并给出最快延迟提示；`no-cors` 探测不读取响应内容。claude.ai 主站受跨域策略（CORP）保护，浏览器无法直接探测，所以边缘可达不代表登录或订阅可用。
- 🧩 **双栈出口与出口类型**：通过 IPv6 专用查询接口读取直连 IPv6 出口并与 HTTP 出口做同协议族比较；按 ASN 与网络组织提示住宅宽带、运营商、数据中心或未知类型。两者均为零权重上下文。
- 🧾 **本地化格式上下文**：读取浏览器实际的日期、时间与数字格式，作为地区画像的补充线索，不参与评分。
- 📊 **覆盖率与未检测状态**：只对实际取到值的信号评分；缺失信号不会抬高或压低分数，覆盖率单独展示。
- 🧾 **报告导出**：复制文本报告或下载 JSON，包含分数、覆盖率、逐项原始值、权重与贡献、建议和限制说明。
- 🌏 **四语言界面**：简体中文、繁体中文、俄文、英文，各自有独立 URL 和 `html lang`。
- 🛡️ **隐私优先**：不登录 Claude，不读取账号敏感内容，不接入第三方访问统计脚本。
- 📦 **静态导出**：Next.js 静态导出到 `out/`，可部署到任意静态托管，无 Node 服务端运行时。
- 🐳 **VPS 一键部署**：Docker Compose + Nginx，默认监听 8080；绑定地址、端口、域名和 HTTPS 按实际环境配置。

> Maintained by **Brilliant666**，基于 yacuo/check-cc 的 MIT 许可代码。

## 📸 页面预览

### 🏠 首页：一键开始检测

![CheckCC 首页](./docs/images/readme/homepage.png)

首页直接展示检测入口，不需要先选择目标地区。默认使用自动检测，网络层默认关闭。

### 🔍 浏览器端检测结果

![CheckCC 浏览器端检测结果](./docs/images/readme/detection-browser-only.png)

浏览器端检测会展示命中的信号、权重贡献、风险分和覆盖率。上图是一个示例中国大陆 Windows 环境：时区和浏览器语言命中，覆盖率 `10/10`，未向第三方发送 IP 查询。Windows 自带的雅黑、宋体只作为上下文显示，不计分；语言文字和 Intl 区域与浏览器语言同组，组内已达上限，所以显示 +0。风险分取决于命中的信号组合。

### 🌐 开启网络层后重测

![CheckCC 开启网络层后的检测结果](./docs/images/readme/detection-network.png)

上图使用示例数据：IP 为公共 DNS 地址，WebRTC 显示为不支持，不代表任何真实访客。点击“开启网络层并重测”后，浏览器会直连 `ipwho.is` 查询出口 IP；如果主接口失败或被限流，会依次尝试 `get.geojs.io` 和 `ipapi.co`，并在提示中显示实际使用的服务。同一次网络层检测还会通过 STUN 收集 WebRTC 出口候选、向 IPv6 专用接口查询直连出口、直连 Anthropic 三个探测目标（claude.ai 边缘诊断路径、www.anthropic.com、api.anthropic.com），用于和 HTTP 出口、IP 时区交叉核对。加权信号最多仍为 `13/13`；信号面板最多展示 29 行（14 项浏览器信号 + 15 项网络信号），其中 IP 国家、WebRTC 出口和 IP 时区加权，其余为上下文。浏览器不支持 WebRTC、STUN 被拦截或没有可比候选时，对应信号标记为“未检测”，覆盖率会下降；端点或 IPv6 探测失败只影响各自的零权重信号。

### 🇭🇰 香港环境独立画像

![CheckCC 香港环境检测结果](./docs/images/readme/detection-hk.png)

繁体中文、香港时区和 `zh-HK` 语言环境会归入香港画像，显示“香港”而不是“中国大陆”。浏览器端示例命中香港画像但风险分为中等，需要进一步确认；香港目前不是手动可选目标，由自动检测识别，开启网络层时香港 IP 会单独核验。

### ⚙️ 内联检测设置

![CheckCC 检测设置](./docs/images/readme/settings.png)

检测目标、网络层开关和隐私说明放在设置浮层里：桌面端在按钮下方弹出、盖在结果上方，手机端从底部弹出，打开时页面不会被推开。按 Esc、点外部或点关闭按钮即可收起。修改检测目标会清空当前结果，需要重新点击检测。

### 🧠 检测原理与重点地区

| 检测原理 | 重点地区 |
| --- | --- |
| <img src="./docs/images/readme/principles.png" alt="CheckCC 检测原理" width="700" /> | <img src="./docs/images/readme/regions.png" alt="CheckCC 重点地区" width="700" /> |

## 🎯 功能详解

### 检测流程

1. **收集浏览器环境**：读取 `navigator.languages`、`Intl.DateTimeFormat().resolvedOptions()`、时区偏移、User-Agent、UA-CH brands 和 Canvas 字体探测结果。
2. **匹配地区画像**：根据语言、时区、Intl 区域、浏览器/设备特征计算与各画像的重合度，选出最匹配的画像。
3. **计算加权信号**：只有取到值的加权信号参与评分；缺失或查询失败的信号标记为“未检测”。
4. **可选网络层**：如果用户开启网络层，浏览器直连第三方 IP 地理服务，补充 IP 国家、ASN、组织与位置；同时通过 STUN 收集 WebRTC 候选，通过 IPv6 专用接口读取直连出口，并直连 Anthropic 端点检查可达性与耗时，随后比较 HTTP / WebRTC / IPv6 出口与 IP 时区。
5. **生成建议与报告**：根据风险分、覆盖率和限制说明生成下一步建议，可复制文本或下载 JSON。

### 已实现的风险信号

| 信号 | 权重 | 说明 |
| --- | ---: | --- |
| 系统时区 | 26 | 系统时区是否与目标画像一致 |
| 浏览器语言 | 20 | 首选语言是否与目标地区一致 |
| IP 所在国家 | 20 | 网络层可选信号，仅在开启网络层时参与 |
| WebRTC 出口 | 18 | 网络层可选信号；同协议族公网候选中没有任何一个等于 HTTP 出口时计分，多出口只作上下文 |
| 字体地区特征 | 16 | 是否命中需要额外安装的中文字体；Windows / macOS / Linux 自带的雅黑、宋体、苹方等只展示不计分 |
| 语言文字特征 | 12 | 简体 / 繁体中文特征 |
| 厂商字体特征 | 10 | MiSans、HarmonyOS Sans、OPPO Sans 等 |
| 浏览器地区特征 | 8 | 微信、QQ、UC、夸克等国产浏览器或 WebView |
| 设备地区特征 | 6 | 华为、荣耀、小米、OPPO、vivo 等设备线索 |
| Intl 区域设置 | 6 | JavaScript 国际化环境暴露的区域 |
| 时区偏移 | 4 | UTC 偏移是否与画像一致 |
| Emoji 渲染风格 | 4 | Apple / Android / Windows Emoji 风格 |
| IP 与系统时区 | 4 | 网络层可选信号；IP 时区与浏览器时区的 UTC 偏移不一致时计分，同一偏移的 IANA 别名视为一致 |

另有浏览器/应用环境、设备/系统线索、操作系统与日期/数字格式 4 项浏览器上下文，以及 IP 地址、IP 位置、ASN、网络组织、出口一致性、WebRTC IPv6 出口、出口类型、IPv6 直连出口、三个端点探测（claude.ai 边缘 / 官网 / API）和端点汇总 12 项网络上下文，只用于展示，不参与评分。

### 评分方式

- 风险分是已评估信号贡献之和，封顶 100，以“xx / 100”展示。它是启发式累加分，不是概率。未评估信号不会抬高或压低分数。
- 测同一件事的信号分组计分，组内贡献合计不超过组内最大权重：系统时区 + 时区偏移（上限 26）、浏览器语言 + 语言文字 + Intl 区域（上限 20）、地区字体 + 厂商字体（上限 16）。浏览器层最高 80 分。
- 分档：70 分及以上为高风险，31–69 为中度，1–30 为轻度。页面、报告和建议使用同一组阈值。
- 浏览器和设备特征按完整 token 匹配，避免 `360`、`vivo` 等命中版本号或其他单词。
- 报告中的“检测地区”是检测出的地区画像，与用户选择的“检测目标”分开记录。
- 覆盖率单独展示，例如 `100% (10/10)` 表示 10 项加权浏览器信号全部完成评估；开启网络层后最多变为 `13/13`（浏览器 10 项 + IP 国家 + WebRTC 出口 + IP 时区）。
- 网络查询失败时，国家信号显示为“查询失败/未检测”，覆盖率下降，但不会把缺失的 20 分权重放大成风险。
- WebRTC 探测失败、浏览器不支持或没有同协议族候选时，WebRTC 出口信号标记为“未检测”；不会因为探测失败自动加分。
- IPv6 出口、出口一致性、出口类型和端点可达性都是零权重上下文，仅用于解释 WebRTC 与 HTTP 出口的关系、网络位置和 Claude 端点连通性，避免与加权信号重复计分。
- IPv6 出口与 HTTP 出口地址族不同（例如 HTTP 走 IPv4、IPv6 直连出口正常）属于正常双栈，不视为泄漏；只有同协议族地址不一致时才标记为不一致。
- 端点探测只能确认网络请求是否完成及耗时，`no-cors` 模式下不读取响应、不判断账号或地区是否可用。
- 国家信号只在 IP 国家命中目标画像时计分；自动检测下，中国大陆、香港、俄罗斯或伊朗 IP 都会计分。
- 自动检测会分别匹配中国大陆、香港、俄罗斯和伊朗画像；繁体中文、香港时区和 `zh-HK` 语言环境归入香港画像。
- 手动目标提供中国大陆和俄罗斯；香港和伊朗由自动检测识别。
- 分数是启发式风险提示，不代表 Anthropic 的实际风控结论；IP 地理位置无法识别 VPN、代理或中转，WebRTC 探测也可能被浏览器或网络策略拦截。

### 报告导出

检测完成后可以复制文本报告或下载 JSON。报告包含：

- 风险分、覆盖率、命中数量
- 每项信号的原始值、权重、贡献和评估状态
- 按风险等级生成的下一步建议
- 当前检测的限制说明

开启网络层时，报告还会包含查询到的 IP、国家、ASN、网络组织、出口类型、WebRTC 出口候选、出口一致性、IPv6 直连出口对比、Claude 端点耗时与 IP 时区对比。报告在浏览器本地生成；分享前请注意其中可能包含你的出口 IP。

### 能力边界

| 能力 | 状态 |
| --- | --- |
| 浏览器端环境采样 | 已实现 |
| 10 项加权浏览器信号 | 已实现 |
| 3 项可选加权网络信号（IP 所在国家 / WebRTC 出口 / IP 与系统时区，默认不请求） | 已实现 |
| WebRTC 出口候选与 HTTP 出口一致性对比 | 已实现（浏览器直连 STUN） |
| 网络层 IP / ASN / 组织 / 位置展示 | 已实现（浏览器直连第三方） |
| Claude 端点可达性与最快延迟（零权重） | 已实现（claude.ai 边缘路径 + 官网 + API，`no-cors` 直连，不读响应；主站受 CORP 限制不探测） |
| IPv6 直连出口与同协议族对比（零权重） | 已实现（浏览器直连 IPv6 查询接口） |
| 出口类型启发式（零权重） | 已实现（基于 ASN / 网络组织名称） |
| 4 项环境上下文 + 12 项网络上下文（不计分） | 已实现 |
| 中国大陆、香港、俄罗斯、伊朗地区画像 | 已实现 |
| 网络层开关与隐私说明 | 已实现（默认关闭，可按需开启） |
| 覆盖率与“未检测”状态 | 已实现 |
| 按风险等级生成下一步建议 | 已实现 |
| 复制文本报告 / 下载 JSON | 已实现 |
| 中文、繁体中文、俄文、英文 | 已实现 |
| 静态导出与自部署 | 已实现 |
| 代理 / VPN 识别 | 不实现完整识别（只比较 HTTP 与 WebRTC 出口，提示明显不一致） |
| DNS 泄漏 / TLS 指纹 / 请求头检测 | 不实现（需要后端或本地探针，纯静态站点无法完成） |
| 读取账号、Cookie、聊天内容 | 不实现 |
| 桌面端一键修复 | 通过 CG-Claude 第三方客户端完成；本站只提供说明与跳转，不下载、不执行 |

### 🔒 隐私设计

![CheckCC 隐私说明](./docs/images/readme/privacy.png)

- 检测不需要登录 Claude，不读取账号、密码、Cookie 或聊天内容。
- 网络层默认关闭；默认检测只使用浏览器信号，不向第三方发送 IP 查询、STUN、IPv6 查询或 Anthropic 端点请求。
- 开启网络层时，浏览器直接请求配置的第三方 IP 地理服务（默认 `ipwho.is`，失败时依次回退到 `get.geojs.io` 和 `ipapi.co`），通过默认的 `stun.cloudflare.com:3478` 收集 WebRTC 候选，向 IPv6 专用接口（默认 `api6.ipify.org`）查询直连出口，并直连 `claude.ai` 边缘诊断路径、`www.anthropic.com` 与 `api.anthropic.com`。claude.ai 主站因 CORP 响应头无法被浏览器跨域探测，因此不请求主站页面。实际被请求到的服务会看到你的公网 IP。请求不经过本站服务器，本站不接收、不转发、不存储查询结果。成功提示会显示本次实际使用的 IP 查询服务。
- 某个 IP 查询服务返回 429（限流）后，浏览器会在本次会话的 `sessionStorage` 里记下它的主机名和 1 小时的冷却截止时间，期间直接跳过它。这里只存主机名和时间，不存 IP 或查询结果；关闭标签页后清除。查询结果本身不缓存，每次检测查的都是当前出口。
- 端点探测使用 `no-cors` 和 `cache: "no-store"`，不携带 Cookie、不发送来源页面，也不读取响应内容；它只能说明浏览器网络能否完成请求，不代表账号或地区可用。
- WebRTC 探测只收集出口候选并与 HTTP 出口比较，不建立媒体通话、不读取设备名称或局域网主机名；浏览器返回的 mDNS 候选不参与评分。
- 请求使用 `credentials: "omit"` 和 `no-referrer`，不携带 Cookie 或来源页面。
- 检测结果不会自动上传；报告由浏览器本地生成。
- 当前版本未接入第三方访问统计脚本。

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
| --- | --- | --- |
| **Next.js** | 16.2.10 | App Router、静态导出 |
| **React** | 19.2.4 | 检测界面与交互 |
| **TypeScript** | 5.9.3 | 类型约束与检测数据结构 |
| **Tailwind CSS** | 4 | 响应式界面 |
| **Vitest** | 3.2.4 | 单元测试 |
| **pnpm** | 9 | 依赖管理 |

项目使用 `output: "export"` 生成纯静态站点，没有服务端运行时；IP 查询与 STUN 探测均由浏览器直接发起。

## 📁 项目结构

```text
review-check-cc/
├─ src/
│  ├─ app/
│  │  ├─ (zh)/                    # 中文根布局与首页
│  │  ├─ (intl)/[locale]/         # 香港、俄罗斯、英文页面
│  │  ├─ robots.ts                # robots.txt
│  │  └─ sitemap.ts               # sitemap.xml
│  ├─ components/
│  │  ├─ detector/Detector.tsx    # 检测流程、设置、报告导出界面
│  │  ├─ home/HomeContent.tsx     # 首页内容与结构化数据
│  │  └─ layout/                  # 页头、页脚、移动菜单
│  ├─ detection/
│  │  ├─ client-engine.ts         # 浏览器环境采样、信号评分与分组上限
│  │  ├─ scoring.ts               # 地区画像匹配、风险分档与 token 匹配
│  │  ├─ merge-signals.ts         # 合并浏览器信号与网络层结果，生成展示用信号列表
│  │  ├─ ip-intel.ts              # 可选网络层查询与解析
│  │  ├─ reachability.ts          # Claude 端点可达性与延迟探测
│  │  ├─ ipv6.ts                  # IPv6 直连出口查询与同协议族对比
│  │  ├─ ip-type.ts               # ASN / 网络组织出口类型启发式
│  │  ├─ webrtc.ts                # WebRTC 出口探测与出口/时区对比
│  │  ├─ report.ts                # 文本 / JSON 报告
│  │  ├─ config/                  # 信号权重、服务与步骤配置
│  │  └─ __tests__/               # 单元测试
│  ├─ i18n/                       # 四语言文案与元信息
│  └─ regions/                    # 中国大陆 / 香港 / 俄罗斯 / 伊朗画像
├─ docs/images/                   # README 截图
├─ deploy/                        # VPS 部署脚本、Nginx 配置与 CSP 生成脚本 csp.mjs
├─ Dockerfile                     # 多阶段构建：静态导出 + 非 root Nginx（镜像按 digest 锁定）
├─ docker-compose.yml             # VPS 一键启动配置
├─ .env.example                   # 部署环境变量模板
├─ shell/deploy-restart-hot.sh    # 本地一键启动脚本
├─ next.config.ts                 # 静态导出配置
└─ package.json
```

## ⚙️ 环境要求

| 环境 | 版本要求 | 说明 |
| --- | --- | --- |
| **Node.js** | >= 20.9 | Next.js 16 要求 |
| **pnpm** | 9 | 推荐包管理器 |
| **操作系统** | Linux / macOS / Windows | 跨平台 |
| **浏览器** | 现代 Chrome / Edge / Safari / Firefox | 需要 Canvas 与 Intl 支持 |

## 🚀 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 启动开发服务（默认 5000 端口）
pnpm dev

# 3. 打开 http://localhost:5000
```

### 构建与预览

```bash
pnpm build      # 静态导出到 out/
pnpm preview    # 在 http://localhost:4173 预览 out/
```

本项目没有 Node 服务端运行时，因此不要使用 `next start`。

## 📦 自部署

### 方式一：VPS 一键部署（Docker + Nginx，推荐）

适用于 Ubuntu / Debian，需要 Docker Engine 20.10+（建议 24+）、Docker Compose v2 和约 2 GB 可用磁盘。Docker 需按官方文档提前安装，脚本不会自动安装。

```bash
git clone https://github.com/Brilliant666/check-cc.git
cd check-cc
cp .env.example .env
# 按实际拓扑编辑 .env
./deploy/deploy.sh
```

部署前先确定三件事：

- **前面有没有反向代理**：已有 Nginx / Caddy / Traefik 时设 `CHECKCC_BIND=127.0.0.1`，由代理转发到 `127.0.0.1:<CHECKCC_PORT>`；
- **端口是否空闲**：`8080` 只是默认值，被占用时改 `CHECKCC_PORT`；容器内部始终监听 8080；
- **有没有正式域名**：有则设置 `NEXT_PUBLIC_SITE_URL=https://你的域名`，否则 canonical、hreflang 和 sitemap 不生成。

`NEXT_PUBLIC_*` 在构建时生效，修改后必须重新构建；`CHECKCC_BIND` 和 `CHECKCC_PORT` 在启动时生效。默认监听 `0.0.0.0:8080`，只建议临时使用；正式环境应只暴露 80/443，并由反向代理接管 HTTPS。

常见坑位：Docker 未安装或未启动、8080 被占用、低内存构建 OOM、改 `.env` 后未重新构建、反向代理 502、`/en` 少了末尾斜杠、网络层失败被误判为服务器故障。完整排错表、SSH 隧道、反向代理、更新回滚和清理见 [deploy/README.md](./deploy/README.md)。

参考验证环境为 Debian 13（2 GB 内存 + 2 GB swap）、Docker Engine 29.9.2 / Compose v5.6.1；这只是验证记录，不是最低配置或强制版本。

### 方式二：手动静态托管

将 `out/` 目录部署到任意静态托管即可，例如 Cloudflare Pages、Netlify、Vercel 或自己的 Nginx：

```bash
pnpm install
pnpm build
# 将 out/ 作为站点根目录
```

### 站点身份配置

页面默认不声明 canonical、hreflang 或 OG URL，页头和页脚的 GitHub 链接指向本仓库。部署时通过环境变量设置站点公开地址：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 空 | 站点公开地址，例如 `https://your-domain.example`。设置后才生成 canonical、hreflang、OG URL 和 JSON-LD URL；未设置时这些字段不输出，避免指向错误站点 |
| `NEXT_PUBLIC_REPO_URL` | `https://github.com/Brilliant666/check-cc` | 页头、页脚和页脚源码入口使用的 GitHub 仓库地址 |

这些变量在构建时读取，修改后需要重新构建。页脚保留 yacuo/check-cc 的 MIT 归属链接，不受上述配置影响。

### 网络层配置

网络层配置在构建时读取环境变量，修改后需要重新构建：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_IP_INTEL_ENABLED` | `true` | 设为 `false` 时彻底关闭网络层，界面不显示开关，也不发送 IP 查询、STUN、IPv6 查询或端点探测。设为 `true` 只提供按需开启的选项，首次检测仍默认不请求 IP |
| `NEXT_PUBLIC_IP_INTEL_ENDPOINT` | `https://ipwho.is/` | 主查询接口，必须是支持 CORS 的 HTTPS 接口；浏览器会直接请求它 |
| `NEXT_PUBLIC_IP_INTEL_FALLBACK_ENDPOINT` | `https://get.geojs.io/v1/ip/geo.json,https://ipapi.co/json/` | 主接口失败、超时或被限流时按顺序尝试的备用接口，多个用英文逗号分隔；设为空字符串可关闭回退。成功提示显示实际使用的服务 |
| `NEXT_PUBLIC_WEBRTC_STUN_URL` | `stun:stun.cloudflare.com:3478` | 网络层开启时使用的 STUN 地址；必须支持 WebRTC，浏览器会直接连接它。修改后需要重新构建 |
| `NEXT_PUBLIC_IPV6_ENDPOINT` | `https://api6.ipify.org?format=json` | IPv6 直连出口查询接口，返回 JSON 的 `ip` 字段；应是只解析 AAAA 记录的 HTTPS 地址 |

接口可以返回 ipwho.is 的原始结构，也可以返回 GeoJS、ipapi.co 或自建接口常见的扁平结构：

```json
{
  "ip": "203.0.113.10",
  "country_code": "US",
  "country": "United States",
  "region": "California",
  "city": "Los Angeles",
  "asn": "AS15169",
  "org": "Example Network",
  "isp": "Example ISP",
  "latitude": 34.05,
  "longitude": -118.24,
  "timezone": "America/Los_Angeles",
  "type": "IPv4"
}
```

每个 IP 查询接口的超时为 3500ms，WebRTC 候选收集为 2500ms，IPv6 直连查询为 3000ms，端点探测为 3500ms（见 `src/detection/config/services.ts`）。主接口超时、跨域失败、返回格式异常或返回内网/保留地址时，会自动尝试备用接口；全部失败后页面才跳过 IP 信号并显示失败原因，不会把失败当成 0 风险，也不会抬高分数。STUN 超时或浏览器不支持 WebRTC 时，仅将 WebRTC 相关信号标记为“未检测”；IPv6 或端点探测失败只影响各自的零权重上下文。

## 🧪 开发与校验

```bash
pnpm lint        # ESLint
pnpm typecheck   # TypeScript
pnpm test        # Vitest，148 项测试
pnpm check       # lint + typecheck + test
pnpm build       # 静态导出
```

GitHub Actions 会在 push 和 pull request 时执行 lint、类型检查、单元测试和静态构建；用到的 actions 按 commit SHA 锁定。CI 不构建 Docker 镜像，容器相关改动需要在有 Docker 的机器上另行验证。

测试覆盖评分不因覆盖率不足而放大、未知信号、零权重信号、IP 地址分类、IP 查询解析/超时/失败、ICE 候选解析、WebRTC 出口与 HTTP 出口对比、IPv6 候选、时区偏移对比、国家画像匹配、香港与大陆画像区分、端点可达性超时与汇总、IPv6 直连出口解析与同协议族对比、出口类型启发式、日期/数字格式上下文、报告导出和多语言文案完整性；以及系统自带中文字体不计分、浏览器/设备特征按 token 匹配、相关信号分组上限、风险分档阈值、报告中检测地区与检测目标分开记录、WebRTC 多出口视为一致，和网络层结果合并（`mergeSignals`）。

## 🗺️ 页面路由

| 路由 | 语言 | 说明 |
| --- | --- | --- |
| `/` | 简体中文 | 默认页面 |
| `/hong-kong/` | 繁体中文 | 香港页面 |
| `/russia/` | 俄文 | 俄罗斯页面 |
| `/en/` | 英文 | 国际页面 |
| `/robots.txt` | — | 抓取规则 |
| `/sitemap.xml` | — | 站点地图（内容仅在设置 `NEXT_PUBLIC_SITE_URL` 时生成） |

## 🐛 常见问题

### 1. 第一次检测没有查询 IP，是正常的吗？

正常。网络层默认关闭，首次检测只使用浏览器信号，覆盖率通常显示 `10/10`。如果希望补充 IP 国家、WebRTC 出口、Claude 端点可达性、IPv6 直连出口和 IP 时区信号，可以点击结果下方的“开启网络层并重测”。

### 2. 为什么香港 IP 没有单独计分？

香港不是手动可选目标，由自动检测画像识别。网络层关闭时，只根据浏览器信号判断；开启网络层后，香港 IP 会作为网络信号单独核验。

### 3. 网络层查询失败会影响分数吗？

不会。主接口失败时会按顺序尝试备用接口，被限流的接口在本次会话内会被暂时跳过；全部接口失败后，国家信号显示为“查询失败/未检测”，覆盖率下降，但分数不会因为缺失的 20 分权重被放大。STUN 被拦截或浏览器不支持 WebRTC 时，同样只是跳过 WebRTC 18 分和 IP 时区 4 分的权重。IPv6 或 Anthropic 端点探测失败只在零权重上下文中显示原因，不影响分数。

### 4. 检测结果能证明账号安全吗？

不能。检测只反映当前浏览器环境和可选的出口 IP 位置，不能预测 Claude 账号状态，也不代表 Anthropic 的实际风控结论。

### 5. 为什么静态部署后 canonical 或 sitemap 为空？

需要设置 `NEXT_PUBLIC_SITE_URL` 后重新构建。未设置时，项目会省略 canonical、hreflang、OG URL 和 sitemap 内容，避免指向错误站点。

### 6. 可以关闭网络层吗？

可以。自部署时设置 `NEXT_PUBLIC_IP_INTEL_ENABLED=false`，界面不会显示网络层开关，也不会发送 IP 查询、STUN、IPv6 查询或端点探测。也可以在检测前关闭设置中的网络层开关。

## 📝 更新日志

### 当前版本

- 网络层改为默认关闭，首次检测不发送 IP 查询
- 网络层新增 `ipwho.is` → `ipapi.co` 自动回退，成功提示显示实际使用的服务
- 新增“开启网络层并重测”，按需补充 IP 国家信号
- 新增香港独立画像，繁体中文 / 香港时区不再归入中国大陆
- 新增 Docker + Nginx VPS 一键部署脚本
- Docker 部署已在 Debian 13 实机验证（构建、健康检查、四语言路由、404、重启）
- 部署文档改为按拓扑选择绑定地址和端口，补充反向代理、低内存、更新回滚与常见坑位排查
- 新增检测完成后的“一键修复，降低封号风险”入口，经确认后跳转 CG-Claude 仓库；页脚标明上游与第三方工具来源
- 网络层新增 WebRTC 出口探测、HTTP / WebRTC 出口一致性、IPv6 出口和 IP 与系统时区对比
- 新增 Claude 端点可达性与最快延迟探测（`claude.ai` 边缘诊断路径 / `www.anthropic.com` / `api.anthropic.com`，零权重）；claude.ai 主站受 CORP 限制，不直接探测
- 新增 IPv6 直连出口查询与同协议族对比、ASN / 网络组织出口类型启发式（零权重）
- 新增日期、时间与数字格式上下文；网络层开关文案与隐私说明同步覆盖新的第三方请求
- WebRTC 探测默认随网络层关闭，失败或不受支持时只降低覆盖率，不改变已有分数
- 四语言文案、README 和隐私说明同步更新
- 评分修正：Windows / macOS / Linux 自带的中文字体只展示不计分，避免普通海外用户被误判
- 评分修正：时区、语言、字体三组相关信号分组计分，组内合计不超过最大权重，浏览器层最高 80 分；分数改为“xx / 100”展示，不再使用百分号
- 评分修正：页面、报告和建议统一使用 70 / 31 两档阈值；删除未使用的旧评分路径
- 浏览器和设备特征改为按完整 token 匹配，`360`、`vivo` 等不再误命中版本号或其他单词
- WebRTC 只要有一个同协议族候选等于 HTTP 出口就视为一致，其他出口作为上下文展示
- 出口类型先匹配具体服务商名称，再用泛化关键词；补充 Chinanet、CMNET、Unicom
- 报告中的“检测地区”改为检测出的地区画像，用户选择的“检测目标”单独记录
- 网络层结果合并逻辑从检测组件抽出为可单测的 `mergeSignals`；俄语结论文案移入语言包
- 部署加固：运行镜像改为非 root 的 `nginx-unprivileged`（容器内监听 8080），容器只读并去掉全部 capabilities；构建时生成 CSP，`connect-src` 只允许实际用到的第三方地址
- 基础镜像按 digest、CI actions 按 commit SHA 锁定
- 148 项单元测试、类型检查、Lint 和静态构建通过；新镜像已在 Debian 13 实机验证

### 未来计划

- 补充更多地区画像与真实设备样本
- 评估更多本地检测 / 修复入口

## 🤝 贡献指南

欢迎提交 Issue 或 Pull Request：

1. Fork 本仓库
2. 创建分支：`git checkout -b feature/your-feature`
3. 提交修改并补充测试
4. 推送分支并创建 Pull Request

提交前请先运行：

```bash
pnpm check
pnpm build
```

## 📧 问题反馈

请通过 GitHub Issues 反馈：<https://github.com/Brilliant666/check-cc/issues>

## 💡 致谢

感谢 [yacuo/check-cc](https://github.com/yacuo/check-cc) 提供上游代码与检测思路；感谢 [TZZ520/claude-environment-check](https://github.com/TZZ520/claude-environment-check) 与 [HeiGeAi/claude-environment-check](https://github.com/HeiGeAi/claude-environment-check) 提供的公开功能思路；感谢 Next.js、React、Tailwind CSS、Vitest 等开源项目。本分支的端点可达性、IPv6 直连出口与出口类型启发式均为独立实现，未复制上述项目的代码。

## 🔗 相关项目

- [yacuo/check-cc](https://github.com/yacuo/check-cc)：本仓库的上游项目，MIT 许可。
- [LcodeCoder/CG-Claude](https://github.com/LcodeCoder/CG-Claude)：独立的第三方本地 Claude 环境检测与配置客户端，支持 macOS、Windows 和 Linux。检测完成后的“一键修复，降低封号风险”按钮会先说明用途，再由你确认跳转到该仓库；CheckCC 不会自动下载或安装，也不会把检测结果发送给它，其效果与安全性请自行判断。
- [TZZ520/claude-environment-check](https://github.com/TZZ520/claude-environment-check) 与 [HeiGeAi/claude-environment-check](https://github.com/HeiGeAi/claude-environment-check)：本分支新增端点可达性、IPv6 直接出口与出口类型提示时参考的公开项目，与本分支没有隶属关系。

## 📄 开源协议与来源

本项目基于 MIT 协议开源，Copyright © yacuo / CheckCC。

你可以自由使用、修改与再分发本项目。任何副本、二次开发版本、自部署站点或项目的实质性部分，都必须保留原始版权与许可声明，并注明来源：<https://github.com/yacuo/check-cc.git>。

如果你重新部署本项目，请保留页脚署名或仓库链接，方便访问者找到原项目。

本分支的修改同样以 MIT 协议发布。上游项目与本分支没有隶属关系；上游 README 中的在线演示、桌面端计划和反馈群信息不适用于本分支。

## ⚠️ 免责声明

CheckCC 的检测结果仅基于浏览器本地环境信号、可选的第三方 IP 地理位置、WebRTC 出口候选、IPv6 直连出口和端点可达性进行风险提示，不代表 Claude 或 Anthropic 官方判断。IP 地理位置可能不准确，WebRTC 探测可能被浏览器或网络策略拦截，端点可达性只表示请求完成与耗时，无法证明账号、订阅或地区可用；工具也无法识别所有 VPN、代理或中转。请勿将检测结果作为账号安全、订阅状态或申诉结果的唯一依据。
