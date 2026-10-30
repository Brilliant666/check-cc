// 根据构建时的网络层端点生成 Nginx 的 Content-Security-Policy 头，输出到 stdout。
// 端点来自与 Next.js 构建相同的 NEXT_PUBLIC_* 变量，修改 .env 后重新构建即可同步。
// Next.js 静态导出会内联 RSC 数据脚本，因此 script-src 保留 'unsafe-inline'；收紧的重点是 connect-src。

const env = process.env;
const ipIntelEnabled = env.NEXT_PUBLIC_IP_INTEL_ENABLED?.trim().toLowerCase() !== "false";
const fallback = env.NEXT_PUBLIC_IP_INTEL_FALLBACK_ENDPOINT;

const endpoints = ipIntelEnabled
  ? [
      env.NEXT_PUBLIC_IP_INTEL_ENDPOINT?.trim() || "https://ipwho.is/",
      // Comma-separated fallbacks, kept in sync with src/detection/config/services.ts.
      ...(fallback === undefined ? "https://get.geojs.io/v1/ip/geo.json,https://ipapi.co/json/" : fallback).split(",").map((value) => value.trim()),
      env.NEXT_PUBLIC_IPV6_ENDPOINT?.trim() || "https://api6.ipify.org?format=json",
      // 端点可达性探测，见 src/detection/reachability.ts。
      "https://claude.ai/cdn-cgi/trace",
      "https://www.anthropic.com/",
      "https://api.anthropic.com/",
    ]
  : [];

function origin(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}

const connect = ["'self'", ...new Set(endpoints.map(origin).filter(Boolean))];

const policy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  `connect-src ${connect.join(" ")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

process.stdout.write(`add_header Content-Security-Policy "${policy}" always;\n`);
