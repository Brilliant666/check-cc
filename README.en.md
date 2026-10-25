<!-- CheckCC English project documentation for open-source users, covering project purpose, capability boundaries, development, and deployment. -->
# CheckCC (Community Fork) | Claude Environment Check & Account-Risk Self-Assessment

[English](README.en.md) | [中文](README.md)

> This repository is a community fork of [yacuo/check-cc](https://github.com/yacuo/check-cc), maintained by [Brilliant666](https://github.com/Brilliant666).
>
> This fork focuses on browser-side environment checks and can optionally add a network-layer signal through a third-party IP geolocation service queried directly by the browser (ipwho.is by default). When the network layer is on, that provider will see your public IP; the request does not pass through this site's server, and this site does not receive or store the result. Results highlight obvious environment-profile conflicts; they are not an official Claude or Anthropic judgment.

[CheckCC.org](https://checkcc.org) is the upstream online demo. This fork prioritizes trustworthy reporting: unevaluated signals are no longer scored as zero risk, the report shows evaluable coverage, the network layer can be turned off, and a failed lookup neither counts as zero risk nor inflates the score.

## Capability boundaries

| Capability | Status |
| --- | --- |
| Browser-side environment sampling | Implemented |
| 10 weighted browser signals | Implemented |
| 1 optional weighted network signal (IP country) | Implemented |
| IP / ASN / organization / location display | Implemented (browser-to-provider) |
| 3 browser context signals + 4 network context signals (not scored) | Implemented |
| Network-layer toggle and privacy disclosure | Implemented |
| Coverage and "not evaluated" states | Implemented |
| Risk-based next-step recommendations | Implemented |
| Copy text report / JSON export | Implemented |
| Chinese, Traditional Chinese, Russian, English | Implemented |
| Static export and self-hosting | Implemented |
| VPN / proxy detection | Not implemented (only the exit IP location is known) |
| Account, cookie, or chat access | Not implemented |
| Desktop one-click repair | Out of scope for this repository |

### Weighted signals

| Signal | Weight |
| --- | ---: |
| System timezone | 26 |
| Browser language | 20 |
| IP country (network layer, can be disabled) | 20 |
| Regional font traits | 16 |
| Language/script traits | 12 |
| Vendor font anomalies | 10 |
| Browser regional traits | 8 |
| Device regional traits | 6 |
| Intl locale | 6 |
| Timezone offset | 4 |
| Emoji rendering style | 4 |

Browser/application environment, device/system clues, and operating system are browser context signals. IP address, IP location, ASN, and network organization are network context signals. None of these seven rows affect the score.

### Scoring

- Only weighted signals with an actual value participate in scoring.
- The score is the sum of evaluated contributions, capped at 100. Unevaluated signals neither raise nor lower it, and coverage is shown separately.
- When the network lookup fails, the country signal is shown as "lookup failed / not evaluated" and coverage drops, but the score is not scaled up to fill the missing 20-point weight.
- The country signal scores only when the IP country matches the target profile. With "Auto detect", an IP in mainland China, Russia, or Iran scores.
- Unevaluated signals are shown as "not evaluated" or "unknown", never treated as zero risk to claim the environment is safe.
- The score is a heuristic risk hint. It does not predict Claude account status or represent Anthropic's actual risk decisions. IP geolocation cannot identify VPNs or proxies; it only locates the exit IP.

### Report export

After a check, you can copy a text report or download JSON. The report includes the risk score, coverage, raw signal values, weights and contributions, recommendations, and limitations, making it easy to save, compare, or attach to a bug report. With the network layer on, the report also contains the detected IP, country, ASN, and network organization. Reports are generated locally; remember that they contain your public IP before sharing them.

## Screenshots

The screenshots below show the upstream UI. Signal rows and copy in this fork may differ slightly.

<p align="center">
  <img src="./docs/images/en/checkcc-detection-signals.png?v=070801" alt="CheckCC detection signals" width="900" />
</p>

| Detection principles | Supported regions |
| --- | --- |
| <img src="./docs/images/en/checkcc-detection-principles.png?v=070801" alt="CheckCC detection principles" width="430" /> | <img src="./docs/images/en/checkcc-supported-regions.png?v=070801" alt="CheckCC supported regions" width="430" /> |

## Use cases

[CheckCC](https://github.com/Brilliant666/check-cc) is suitable for learning, secondary development, and self-hosting. It is aimed at users creating a Claude account, subscribing to Claude Pro, applying for Claude API access, using Claude Code, or concerned about account restrictions and subscription failures. It focuses on environment risk hints and does not read Claude account content or replace official Claude or Anthropic judgments.

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
- **Network egress (optional)**: the browser queries a third-party IP geolocation service directly for the public IP, country, ASN, organization, and approximate location. Only the country affects the score; the rest is shown for context.

These signals cannot prove that an account is safe or will be restricted, but they can reveal obvious environment-profile conflicts early. The network layer only locates the exit IP. It cannot tell whether a VPN, proxy, or relay is in use, and it cannot verify the account's registration or payment region.

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

Checking does not require a Claude login and does not read your Claude account, password, cookies, or chat content.

The network layer is on by default and can be turned off before a check:

- When on, your browser sends an HTTPS request directly to the configured third-party IP geolocation service (`ipwho.is` by default). That service will see your public IP, which is required for the lookup.
- The request does not pass through this site's server. This site does not receive, forward, or store the result. The request uses `credentials: "omit"` and `no-referrer`, so no cookies or referring page are sent.
- When off, no IP lookup request is sent and the check uses browser signals only.
- Results are not uploaded automatically. Copied or downloaded reports are generated locally in the browser.
- With the network layer on, exported reports contain your public IP, country, ASN, and network organization. Consider that before sharing a report.

Self-hosters can set `NEXT_PUBLIC_IP_INTEL_ENABLED=false` to remove the network layer at build time, or point `NEXT_PUBLIC_IP_INTEL_ENDPOINT` at their own CORS-enabled lookup endpoint.

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

Open: <http://localhost:5000>

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

### Site identity configuration

By default the build emits no canonical, hreflang, or OG URL, and the header/footer GitHub links point to this repository. Set the public site address at build time:

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | empty | Public site URL, for example `https://your-domain.example`. When set, canonical, hreflang, OG URL, and JSON-LD URL are emitted. When empty, those fields are omitted so they cannot point at the wrong site. |
| `NEXT_PUBLIC_REPO_URL` | `https://github.com/Brilliant666/check-cc` | GitHub repository used by the header, footer, and footer source link. |

These values are read at build time; rebuild after changing them. The footer always keeps the MIT credit link to yacuo/check-cc.

### Network layer configuration

The network layer reads these environment variables at build time; rebuild after changing them:

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_IP_INTEL_ENABLED` | `true` | Set to `false` to remove the network layer entirely: no toggle, no IP lookup |
| `NEXT_PUBLIC_IP_INTEL_ENDPOINT` | `https://ipwho.is/` | Must be an HTTPS, CORS-enabled endpoint that the browser can call directly |

The endpoint may return the native ipwho.is shape or this flat shape:

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

The lookup times out after 3500 ms (see `src/detection/config/services.ts`). Timeouts, CORS failures, malformed responses, and private/reserved addresses cause IP signals to be skipped with a failure notice; failures are not treated as zero risk and do not inflate the score.

## Development and checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm check
```

`pnpm check` runs lint, type checking, and unit tests. GitHub Actions runs the same checks on push and pull requests, plus a static build.

Tests cover score non-inflation under partial coverage, unknown signals, zero-weight signals, IP classification, IP lookup parsing/timeouts/failures, country-profile matching, report export, and locale copy completeness.

## Feedback

Please use GitHub Issues: <https://github.com/Brilliant666/check-cc/issues>

## Disclaimer

[CheckCC](https://github.com/Brilliant666/check-cc) provides risk hints based on local browser environment signals and optional third-party IP geolocation. It does not represent official Claude or Anthropic judgments. IP geolocation may be inaccurate and cannot identify VPNs, proxies, or relays. Do not use the result as the only basis for account safety, subscription status, or appeal decisions.

## License and source

This project is open-sourced under the MIT License. Copyright © yacuo / CheckCC.

You may use, modify, and redistribute this project freely.

Any copy, secondary development version, self-hosted site, or substantial portion of the project must retain the original copyright and license notice, and credit the source: <https://github.com/yacuo/check-cc.git>.

If you redeploy this project, keep the footer credit or repository link so visitors can find the original project.

Changes in this fork are also released under the MIT License. This fork is not affiliated with the upstream project; upstream demo, desktop-app plans, and feedback-group information do not apply to this fork.
