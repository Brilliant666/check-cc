<!-- CheckCC 中文项目说明文档，用于向开源用户介绍项目用途、检测能力边界、开发方式与部署方式。 -->
# CheckCC（社区分支）｜Claude 环境检测与封号风险自查

[中文](README.md) | [English](README.en.md)

> 本仓库是 [yacuo/check-cc](https://github.com/yacuo/check-cc) 的社区分支，当前由 [Brilliant666](https://github.com/Brilliant666) 维护。
>
> 本分支以浏览器端环境检测为主，并可选地通过浏览器直连第三方 IP 地理定位服务（默认 [ipwho.is](https://ipwho.is/)）补充网络层信号。开启网络层时，第三方服务会看到你的公网 IP；请求不经过本站服务器，本站也不接收或存储查询结果。检测结果用于发现明显的环境画像冲突，不代表 Claude 或 Anthropic 的官方判断。

[CheckCC.org](https://checkcc.org) 是上游项目的在线演示。本分支在上游基础上优先修正了检测结论的可信度：未评估的信号不再按 0 分处理，报告会显示可评估覆盖率；网络层可以关闭，查询失败时不会被当成 0 风险，也不会抬高分数。

## 当前能力边界

| 能力 | 状态 |
| --- | --- |
| 浏览器端环境采样 | 已实现 |
| 10 项加权浏览器信号 | 已实现 |
| 1 项可选加权网络信号（IP 所在国家） | 已实现 |
| 网络层 IP / ASN / 组织 / 位置展示 | 已实现（浏览器直连第三方） |
| 3 项环境上下文 + 4 项网络上下文（不计分） | 已实现 |
| 网络层开关与隐私说明 | 已实现 |
| 覆盖率与“未检测”状态 | 已实现 |
| 按风险等级生成下一步建议 | 已实现 |
| 复制文本报告 / 下载 JSON | 已实现 |
| 中文、繁体中文、俄文、英文 | 已实现 |
| 静态导出与自部署 | 已实现 |
| 代理 / VPN 识别 | 不实现（只反映出口 IP 的地理位置） |
| 读取账号、Cookie、聊天内容 | 不实现 |
| 桌面端一键修复 | 不在本仓库范围 |

### 已实现的风险信号

| 信号 | 权重 |
| --- | ---: |
| 系统时区 | 26 |
| 浏览器语言 | 20 |
| IP 所在国家（网络层，可关闭） | 20 |
| 字体地区特征 | 16 |
| 语言文字特征 | 12 |
| 厂商字体特征 | 10 |
| 浏览器地区特征 | 8 |
| 设备地区特征 | 6 |
| Intl 区域设置 | 6 |
| 时区偏移 | 4 |
| Emoji 渲染风格 | 4 |

另有浏览器/应用环境、设备/系统线索、操作系统 3 项浏览器上下文，以及 IP 地址、IP 位置、ASN、网络组织 4 项网络上下文，只用于展示，不参与评分。

### 评分方式

- 只有实际取到值的加权信号才参与评分。
- 风险分是已评估信号贡献之和，封顶 100；未评估信号不会抬高或压低分数，覆盖率单独展示。
- 网络查询失败时，国家信号显示为“查询失败/未检测”，覆盖率随之下降，但分数不会因为缺失的 20 分权重被放大。
- 国家信号只在 IP 国家命中目标画像时计分；目标地区为“自动检测”时，命中中国大陆、俄罗斯或伊朗画像都会计分。
- 浏览器语言、Intl 区域和系统时区按所选目标画像评分；中文字体、厂商字体、UTC+8 偏移等中国专属信号只在“自动检测”或“中国大陆”目标下计分，避免选择俄罗斯时仍被中文特征抬高分数。
- 未评估信号显示为“未检测”或“未知”，不会被当成 0 风险来宣称环境安全。
- 分数是启发式风险提示，不是 Claude 账号状态的预测，也不代表 Anthropic 的实际风控结论；IP 地理位置无法识别 VPN/代理，只能说明出口 IP 的位置。

### 报告导出

检测完成后可以复制文本报告或下载 JSON。报告包含风险分、覆盖率、逐项信号的原始值、权重与贡献、建议和限制说明，便于保存、对比或提交问题反馈。开启网络层时，报告还会包含查询到的 IP、国家、ASN 和网络组织；报告在本地生成，分享前请注意其中包含你的出口 IP。

## 项目截图

以下截图为上游版本界面，当前分支的检测项与文案可能略有差异。

<p align="center">
  <img src="./docs/images/cn/checkcc-detection-signals.png?v=070801" alt="CheckCC 检测指标示例" width="900" />
</p>

| 检测原理 | 重点检测地区 |
| --- | --- |
| <img src="./docs/images/cn/checkcc-detection-principles.png?v=070801" alt="CheckCC 检测原理" width="430" /> | <img src="./docs/images/cn/checkcc-supported-regions.png?v=070801" alt="CheckCC 重点检测地区" width="430" /> |

## 适用场景

[CheckCC](https://github.com/Brilliant666/check-cc) 适合用于学习、二次开发和自部署，面向正在注册 Claude 账号、订阅 Claude Pro、申请 Claude API、使用 Claude Code，或担心 Claude 封号、账号受限、订阅失败的用户。项目专注于 Claude 使用前后的环境风险提示，不读取 Claude 账号内容，不替代 Claude 或 Anthropic 的官方判断。

如果你基于本项目进行二次开发、重新部署或发布衍生版本，请保留原始版权、开源许可声明与项目来源：<https://github.com/yacuo/check-cc.git>。

## 技术原理

Claude 账号风险通常不是由单一 IP 或地区因素决定，而是由系统时区、浏览器语言、国际化配置、字体、设备特征和运行容器等多维信号共同构成环境画像。本分支通过浏览器端采样，把分散的技术指标聚合为可读的风险提示。

核心检测维度包括：

- **浏览器语言**：判断浏览器首选语言是否与目标地区一致。
- **系统时区与偏移**：判断系统时区、UTC 偏移是否与地区画像匹配。
- **Intl Locale**：检查 JavaScript 国际化环境是否暴露异常语言或地区特征。
- **语言文字与字体**：检查简体/繁体语言文字特征，以及中国、厂商字体的命中情况。
- **运行环境**：识别浏览器、App 内 WebView、国产浏览器和移动设备特征。
- **Emoji 渲染风格**：辅助判断系统与浏览器环境是否一致。
- **网络出口（可选）**：由浏览器直连第三方 IP 地理定位服务，读取公网 IP、国家、ASN、组织和大致位置；只有国家会参与评分，其余信息用于展示和核对。

这些信号不能证明账号一定安全或一定会被限制，但可以帮助用户提前发现明显的环境画像冲突。网络层只能看到出口 IP 的位置，不能判断是否使用了 VPN、代理或中转，也不能验证账号的注册地区和支付地区。

## 如何降低封号风险

[CheckCC](https://checkcc.org) 的检测结果仅供参考，不代表 Claude 或 Anthropic 官方结论。使用 Claude、Claude Code、Claude Pro 或申请 Claude API 前，可以先检查运行环境。

一般建议：

- 尽量保持网络出口、系统时区、浏览器语言和账号地区一致。
- 避免频繁切换国家、代理节点、设备和浏览器环境。
- 避免在 WebView、自动化浏览器、异常客户端或不稳定容器中登录账号。
- 订阅 Claude Pro、申请 Claude API 或使用 Claude Code 前，先检查运行环境。
- 如果检测到高风险信号，先调整环境，再继续登录、订阅或申请相关服务。
- 尽量使用长期稳定的网络出口和一致的设备环境，减少账号画像剧烈变化。
- 不要通过伪造时区或修改语言来规避地区限制；环境与账号资料不一致可能增加风险。

## 隐私说明

检测过程不需要登录 Claude，也不会读取 Claude 账号、密码、Cookie 或聊天内容。

网络层默认开启，可以在检测前关闭：

- 开启时，浏览器会直接向配置的第三方 IP 地理定位服务（默认 `ipwho.is`）发起 HTTPS 请求；该服务会看到你的公网 IP，这是查询本身必需的。
- 请求不经过本站服务器，本站不接收、不转发、不存储查询结果；请求使用 `credentials: "omit"` 和 `no-referrer`，不携带 Cookie 或来源页面。
- 关闭后不会向第三方发送 IP 查询请求，检测只使用浏览器信号。
- 检测结果不会自动上传；复制或下载的报告由浏览器在本地生成。
- 开启网络层时，导出的报告会包含你的公网 IP、国家、ASN 和网络组织，分享前请自行判断。

自部署者可以用 `NEXT_PUBLIC_IP_INTEL_ENABLED=false` 在构建时彻底关闭网络层，或把 `NEXT_PUBLIC_IP_INTEL_ENDPOINT` 指向自己的、支持 CORS 的查询接口。

## 技术栈

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- pnpm 9

## 快速开始

要求 Node.js >= 20.9 和 pnpm 9。

```bash
pnpm install
pnpm dev
```

打开：<http://localhost:5000>

## 构建与预览

项目使用 Next.js 静态导出（`output: "export"`），构建产物位于 `out/`：

```bash
pnpm build
pnpm preview
```

`pnpm preview` 使用静态文件服务器在 <http://localhost:4173> 预览 `out/`。本项目没有 Node 服务端运行时，因此不要使用 `next start`。

## 自部署

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
| `NEXT_PUBLIC_SITE_URL` | 空 | 站点公开地址，例如 `https://your-domain.example`。设置后才生成 canonical、hreflang、OG URL 和 JSON-LD URL；未设置时这些字段不输出，避免指向错误站点。 |
| `NEXT_PUBLIC_REPO_URL` | `https://github.com/Brilliant666/check-cc` | 页头、页脚和页脚源码入口使用的 GitHub 仓库地址。 |

这些变量在构建时读取，修改后需要重新构建。页脚保留 yacuo/check-cc 的 MIT 归属链接，不受上述配置影响。

### 网络层配置

网络层配置在构建时读取环境变量，修改后需要重新构建：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_IP_INTEL_ENABLED` | `true` | 设为 `false` 时彻底关闭网络层，界面不显示开关，也不发送 IP 查询 |
| `NEXT_PUBLIC_IP_INTEL_ENDPOINT` | `https://ipwho.is/` | 必须是支持 CORS 的 HTTPS 接口；浏览器会直接请求它 |

接口可以返回 ipwho.is 的原始结构，也可以返回下面的扁平结构：

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
  "type": "IPv4"
}
```

查询超时为 3500ms（见 `src/detection/config/services.ts`）。超时、跨域失败、返回格式异常或返回内网/保留地址时，页面会跳过 IP 信号并显示失败原因，不会把失败当成 0 风险，也不会抬高分数。

## 开发与校验

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm check
```

`pnpm check` 会依次执行 lint、类型检查和单元测试。GitHub Actions 会在 push 和 pull request 时执行同样的检查，并额外运行一次静态构建。

测试覆盖评分不因覆盖率不足而放大、未知信号、零权重信号、IP 地址分类、IP 查询解析/超时/失败、国家画像匹配、报告导出和多语言文案完整性。

## 问题反馈

请通过 GitHub Issues 反馈：<https://github.com/Brilliant666/check-cc/issues>

## 免责声明

[CheckCC](https://github.com/Brilliant666/check-cc) 的检测结果仅基于浏览器本地环境信号和可选的第三方 IP 地理位置进行风险提示，不代表 Claude 或 Anthropic 官方判断。IP 地理位置可能不准确，也无法识别 VPN、代理或中转。请勿将检测结果作为账号安全、订阅状态或申诉结果的唯一依据。

## 开源协议与来源

本项目基于 MIT 协议开源，Copyright © yacuo / CheckCC。

你可以自由使用、修改与再分发本项目。

任何副本、二次开发版本、自部署站点或项目的实质性部分，都必须保留原始版权与许可声明，并注明来源：<https://github.com/yacuo/check-cc.git>。

如果你重新部署本项目，请保留页脚署名或仓库链接，方便访问者找到原项目。

本分支的修改同样以 MIT 协议发布。上游项目与本分支没有隶属关系；上游 README 中的在线演示、桌面端计划和反馈群信息不适用于本分支。
