<!-- CheckCC English project documentation for open-source users, covering project purpose, capability boundaries, development, and deployment. -->
# CheckCC (Community Fork) | Claude Environment Check & Account-Risk Self-Assessment

[English](README.en.md) | [中文](README.md)

> This repository is a community fork of [yacuo/check-cc](https://github.com/yacuo/check-cc), maintained by [Brilliant666](https://github.com/Brilliant666).
>
> This fork currently performs browser-side environment checks only. It does not request your IP address, network egress, account data, or cookies. Results highlight obvious environment-profile conflicts; they are not an official Claude or Anthropic judgment.

[CheckCC.org](https://checkcc.org) is the upstream online demo. This fork prioritizes trustworthy reporting: unevaluated signals are no longer scored as zero risk, the report shows evaluable coverage, and the UI states clearly when network-layer checks are disabled.

## Capability boundaries

| Capability | Status |
| --- | --- |
| Browser-side environment sampling | Implemented |
| 10 weighted risk signals | Implemented |
| 3 context signals (not scored) | Implemented |
| Coverage and "not evaluated" states | Implemented |
| Risk-based next-step recommendations | Implemented |
| Copy text report / JSON export | Implemented |
| Chinese, Traditional Chinese, Russian, English | Implemented |
| Static export and self-hosting | Implemented |
| IP / ASN / network egress intelligence | Not enabled |
| Account, cookie, or chat access | Not implemented |
| Desktop one-click repair | Out of scope for this repository |

### Weighted signals

| Signal | Weight |
| --- | ---: |
| System timezone | 26 |
| Browser language | 20 |
| Regional font traits | 16 |
| Language/script traits | 12 |
| Vendor font anomalies | 10 |
| Browser regional traits | 8 |
| Device regional traits | 6 |
| Intl locale | 6 |
| Timezone offset | 4 |
| Emoji rendering style | 4 |

Browser/application environment, device/system clues, and operating system are shown as context only and do not affect the score.

### Scoring

- Only weighted signals with an actual value participate in scoring.
- The score is normalized over evaluated weight, and the report shows coverage.
- Unevaluated signals are shown as "not evaluated" or "unknown", never as zero risk.
- The score is a heuristic risk hint. It does not predict Claude account status or represent Anthropic's actual risk decisions.

### Report export

After a check, you can copy a text report or download JSON. The report includes the risk score, coverage, raw signal values, weights and contributions, recommendations, and limitations, making it easy to save, compare, or attach to a bug report.

## Screenshots

The screenshots below show the upstream UI. Signal rows and copy in this fork may differ slightly.

<p align="center">
  <img src="./docs/images/en/checkcc-detection-signals.png?v=070801" alt="CheckCC detection signals" width="900" />
</p>

| Detection principles | Supported regions |
| --- | --- |
| <img src="./docs/images/en/checkcc-detection-principles.png?v=070801" alt="CheckCC detection principles" width="430" /> | <img src="./docs/images/en/checkcc-supported-regions.png?v=070801" alt="CheckCC supported regions" width="430" /> |

## Use cases

[CheckCC](https://checkcc.org) is suitable for learning, secondary development, and self-hosting. It is aimed at users creating a Claude account, subscribing to Claude Pro, applying for Claude API access, using Claude Code, or concerned about account restrictions and subscription failures. It focuses on environment risk hints and does not read Claude account content or replace official Claude or Anthropic judgments.

If you use this project for secondary development, redeployment, or derivative releases, retain the original copyright, open-source license notice, and project source: <https://github.com/yacuo/check-cc.git>.

## How it works

Claude account risk is usually shaped by a combination of timezone, browser language, internationalization settings, fonts, device traits, and runtime container rather than a single IP or region. This fork samples those signals in the browser and turns them into a readable risk hint.

Core dimensions:

- **Browser language**: whether the preferred browser language matches the target region.
- **System timezone and offset**: whether the timezone and UTC offset match the regional profile.
- **Intl locale**: whether JavaScript internationalization exposes unusual language or region traits.
- **Script and fonts**: simplified/traditional Chinese script traits and regional/vendor font matches.
- **Runtime environment**: browsers, in-app WebViews, domestic browsers, and mobile device traits.
- **Emoji rendering style**: a secondary signal for system and browser consistency.

These signals cannot prove that an account is safe or will be restricted, but they can reveal obvious environment-profile conflicts early.

## Reducing ban risk

CheckCC results are for reference only and do not represent official conclusions from Claude or Anthropic. Before using Claude, Claude Code, Claude Pro, or applying for Claude API access, you can check your environment first.

General suggestions:

- Keep network egress, system timezone, browser language, and account region as consistent as possible.
- Avoid frequently switching countries, proxy nodes, devices, or browser environments.
- Avoid signing in through WebView, automated browsers, unusual clients, or unstable containers.
- Check the environment before subscribing to Claude Pro, applying for Claude API, or using Claude Code.
- If high-risk signals are detected, adjust the environment before signing in, subscribing, or applying.
- Prefer stable long-term network egress and consistent device environments.
- Do not spoof timezone or language to bypass regional restrictions; inconsistent environment and account data can increase risk.

## Privacy

By default, the project performs local browser environment checks only:

- No Claude login required
- No Claude account access
- No password access
- No cookie access
- No chat content access
- No IP, ASN, or network egress requests
- No default upload of detection results

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- pnpm 9

## Quick start

Requires Node.js >= 20.9 and pnpm 9.

```bash
pnpm install
pnpm dev
```

Open: <http://localhost:3000>

## Build and preview

The project uses Next.js static export (`output: "export"`). Build output is written to `out/`:

```bash
pnpm build
pnpm preview
```

`pnpm preview` serves `out/` at <http://localhost:4173> with a static file server. There is no Node server runtime, so do not use `next start`.

## Self-hosting

Deploy the `out/` directory to any static host, such as Cloudflare Pages, Netlify, Vercel, or your own Nginx:

```bash
pnpm install
pnpm build
# serve out/ as the site root
```

The upstream pages still point canonical, OG, and live-demo links to checkcc.org. Replace those values with your own domain before deploying so traffic and search results do not flow to the wrong site.

## Development and checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm check
```

`pnpm check` runs lint, type checking, and unit tests. GitHub Actions runs the same checks on push and pull requests, plus a static build.

Tests cover score normalization, coverage, unknown signals, zero-weight signals, IP classification, report export, and locale copy completeness.

## Feedback

Please use GitHub Issues: <https://github.com/Brilliant666/check-cc/issues>

## Disclaimer

CheckCC provides risk hints based on local browser environment signals only. It does not represent official Claude or Anthropic judgments. Do not use the result as the only basis for account safety, subscription status, or appeal decisions.

## License and source

This project is open-sourced under the MIT License. Copyright © yacuo / CheckCC.

You may use, modify, and redistribute this project freely.

Any copy, secondary development version, self-hosted site, or substantial portion of the project must retain the original copyright and license notice, and credit the source: <https://github.com/yacuo/check-cc.git>.

If you redeploy this project, keep the footer credit or repository link so visitors can find the original project.

Changes in this fork are also released under the MIT License. This fork is not affiliated with the upstream project; upstream demo, desktop-app plans, and feedback-group information do not apply to this fork.
