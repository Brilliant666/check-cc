// 浏览器侧 Claude/Anthropic 端点可达性探测，只观察请求是否完成和耗时，不读取响应内容。
export type ReachabilityStatus = "reachable" | "timeout" | "error";

export type ReachabilityTarget = {
  signalId: string;
  host: string;
  url: string;
};

export type ReachabilityResult = ReachabilityTarget & {
  status: ReachabilityStatus;
  latencyMs: number | null;
};

export type ReachabilitySummary = {
  reachableCount: number;
  total: number;
  status: "all" | "partial" | "none";
  fastestMs: number | null;
};

export type ReachabilityOptions = {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  targets?: ReachabilityTarget[];
};

// claude.ai 主站返回 CORP: same-origin，浏览器无法跨域探测；改测同一站点的 Cloudflare 边缘诊断路径。
// 该结果只代表边缘可达，不代表登录、订阅或地区可用。
export const defaultReachabilityTargets: ReachabilityTarget[] = [
  { signalId: "claudeAiReachability", host: "claude.ai", url: "https://claude.ai/cdn-cgi/trace" },
  { signalId: "anthropicSiteReachability", host: "www.anthropic.com", url: "https://www.anthropic.com/" },
  { signalId: "apiReachability", host: "api.anthropic.com", url: "https://api.anthropic.com/" },
];

async function probeTarget(target: ReachabilityTarget, timeoutMs: number, fetchImpl: typeof fetch): Promise<ReachabilityResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const started = Date.now();
  try {
    await fetchImpl(target.url, {
      mode: "no-cors",
      credentials: "omit",
      cache: "no-store",
      redirect: "follow",
      referrerPolicy: "no-referrer",
      signal: controller.signal,
    });
    return { ...target, status: "reachable", latencyMs: Math.max(0, Date.now() - started) };
  } catch {
    return { ...target, status: controller.signal.aborted ? "timeout" : "error", latencyMs: null };
  } finally {
    clearTimeout(timer);
  }
}

export async function probeReachability(options: ReachabilityOptions = {}): Promise<ReachabilityResult[]> {
  const { timeoutMs = 3500, fetchImpl = fetch, targets = defaultReachabilityTargets } = options;
  return Promise.all(targets.map((target) => probeTarget(target, timeoutMs, fetchImpl)));
}

export function summarizeReachability(results: ReachabilityResult[]): ReachabilitySummary {
  const reachable = results.filter((result) => result.status === "reachable");
  const latencies = reachable.map((result) => result.latencyMs).filter((value): value is number => value !== null);
  return {
    reachableCount: reachable.length,
    total: results.length,
    status: reachable.length === 0 ? "none" : reachable.length === results.length ? "all" : "partial",
    fastestMs: latencies.length ? Math.min(...latencies) : null,
  };
}

export function reachabilityLatencyLevel(ms: number | null): "low" | "medium" | "high" | null {
  if (ms === null) return null;
  if (ms < 800) return "low";
  if (ms < 1800) return "medium";
  return "high";
}
