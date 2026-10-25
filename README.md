<!-- CheckCC 中文项目说明文档，用于向开源用户介绍项目用途、检测能力边界、开发方式与部署方式。 -->
# CheckCC（社区分支）｜Claude 环境检测与封号风险自查

[中文](README.md) | [English](README.en.md)

> 本仓库是 [yacuo/check-cc](https://github.com/yacuo/check-cc) 的社区分支，当前由 [Brilliant666](https://github.com/Brilliant666) 维护。
>
> 本分支目前只做浏览器端环境检测，不请求 IP、网络出口、账号或 Cookie 数据。检测结果用于发现明显的环境画像冲突，不代表 Claude 或 Anthropic 的官方判断。

[CheckCC.org](https://checkcc.org) 是上游项目的在线演示。本分支在上游基础上优先修正了检测结论的可信度：未评估的信号不再按 0 分处理，报告会显示可评估覆盖率，并在网络层检测未启用时明确说明。

## 当前能力边界

| 能力 | 状态 |
| --- | --- |
| 浏览器端环境采样 | 已实现 |
| 10 项加权风险信号 | 已实现 |
| 3 项环境上下文信息（不计分） | 已实现 |
| 覆盖率与“未检测”状态 | 已实现 |
| 按风险等级生成下一步建议 | 已实现 |
| 复制文本报告 / 下载 JSON | 已实现 |
| 中文、繁体中文、俄文、英文 | 已实现 |
| 静态导出与自部署 | 已实现 |
| IP / ASN / 网络出口情报 | 未启用 |
| 读取账号、Cookie、聊天内容 | 不实现 |
| 桌面端一键修复 | 不在本仓库范围 |

### 已实现的风险信号

| 信号 | 权重 |
| --- | ---: |
| 系统时区 | 26 |
| 浏览器语言 | 20 |
| 字体地区特征 | 16 |
| 语言文字特征 | 12 |
| 厂商字体异常 | 10 |
| 浏览器地区特征 | 8 |
| 设备地区特征 | 6 |
| Intl 区域设置 | 6 |
| 时区偏移 | 4 |
| Emoji 渲染风格 | 4 |

另有浏览器/应用环境、设备/系统线索、操作系统 3 项上下文信息，只用于展示，不参与评分。

### 评分方式

- 只有实际取到值的加权信号才参与评分。
- 分数按已评估信号的权重归一，并在报告中显示覆盖率。
- 未评估信号显示为“未检测”或“未知”，不会被当成 0 风险。
- 分数是启发式风险提示，不是 Claude 账号状态的预测，也不代表 Anthropic 的实际风控结论。

### 报告导出

检测完成后可以复制文本报告或下载 JSON。报告包含风险分、覆盖率、逐项信号的原始值、权重与贡献、建议和限制说明，便于保存、对比或提交问题反馈。

## 项目截图

以下截图为上游版本界面，当前分支的检测项与文案可能略有差异。

<p align="center">
  <img src="./docs/images/cn/checkcc-detection-signals.png?v=070801" alt="CheckCC 检测指标示例" width="900" />
</p>

| 检测原理 | 重点检测地区 |
| --- | --- |
| <img src="./docs/images/cn/checkcc-detection-principles.png?v=070801" alt="CheckCC 检测原理" width="430" /> | <img src="./docs/images/cn/checkcc-supported-regions.png?v=070801" alt="CheckCC 重点检测地区" width="430" /> |

## 适用场景

[CheckCC](https://checkcc.org) 适合用于学习、二次开发和自部署，面向正在注册 Claude 账号、订阅 Claude Pro、申请 Claude API、使用 Claude Code，或担心 Claude 封号、账号受限、订阅失败的用户。项目专注于 Claude 使用前后的环境风险提示，不读取 Claude 账号内容，不替代 Claude 或 Anthropic 的官方判断。

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

这些信号不能证明账号一定安全或一定会被限制，但可以帮助用户提前发现明显的环境画像冲突。

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

项目默认只做浏览器本地环境检测：

- 不需要登录 Claude
- 不读取 Claude 账号
- 不读取密码
- 不读取 Cookie
- 不读取聊天内容
- 不请求 IP、ASN 或网络出口信息
- 不默认上传检测结果

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

打开：<http://localhost:3000>

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

上游页面中的 canonical、OG 和在线演示链接仍指向 checkcc.org。重新部署前请按你的域名替换这些配置，避免访问统计和搜索结果流向错误站点。

## 开发与校验

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm check
```

`pnpm check` 会依次执行 lint、类型检查和单元测试。GitHub Actions 会在 push 和 pull request 时执行同样的检查，并额外运行一次静态构建。

测试覆盖评分归一化、覆盖率、未知信号、零权重信号、IP 地址分类、报告导出和多语言文案完整性。

## 问题反馈

请通过 GitHub Issues 反馈：<https://github.com/Brilliant666/check-cc/issues>

## 免责声明

[CheckCC](https://checkcc.org) 的检测结果仅基于浏览器本地环境信号进行风险提示，不代表 Claude 或 Anthropic 官方判断。请勿将检测结果作为账号安全、订阅状态或申诉结果的唯一依据。

## 开源协议与来源

本项目基于 MIT 协议开源，Copyright © yacuo / CheckCC。

你可以自由使用、修改与再分发本项目。

任何副本、二次开发版本、自部署站点或项目的实质性部分，都必须保留原始版权与许可声明，并注明来源：<https://github.com/yacuo/check-cc.git>。

如果你重新部署本项目，请保留页脚署名或仓库链接，方便访问者找到原项目。

本分支的修改同样以 MIT 协议发布。上游项目与本分支没有隶属关系；上游 README 中的在线演示、桌面端计划和反馈群信息不适用于本分支。
