import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultReachabilityTargets, probeReachability, reachabilityLatencyLevel, summarizeReachability, type ReachabilityResult } from "../reachability";

const target = { signalId: "anthropicSiteReachability", host: "www.anthropic.com", url: "https://www.anthropic.com/" };

function result(overrides: Partial<ReachabilityResult>): ReachabilityResult {
  return { ...target, status: "reachable", latencyMs: 100, ...overrides };
}

describe("probeReachability", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("uses an opaque no-cors request and records latency", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, type: "opaque" }) as Response);
    const [probe] = await probeReachability({ fetchImpl, targets: [target], timeoutMs: 500 });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://www.anthropic.com/",
      expect.objectContaining({ mode: "no-cors", credentials: "omit", cache: "no-store", referrerPolicy: "no-referrer" }),
    );
    expect(probe.status).toBe("reachable");
    expect(probe.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("marks aborted requests as timeouts", async () => {
    vi.useFakeTimers();
    const fetchImpl = vi.fn((_url: RequestInfo | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      });
    });
    const pending = probeReachability({ fetchImpl, targets: [target], timeoutMs: 50 });
    await vi.advanceTimersByTimeAsync(60);
    const [probe] = await pending;

    expect(probe.status).toBe("timeout");
    expect(probe.latencyMs).toBeNull();
  });

  it("marks immediate failures as errors", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error("network down");
    });
    const [probe] = await probeReachability({ fetchImpl, targets: [target], timeoutMs: 500 });

    expect(probe.status).toBe("error");
  });

  it("probes the default Anthropic endpoints without the CORP-protected app page", () => {
    expect(defaultReachabilityTargets.map((item) => item.host)).toEqual(["claude.ai", "www.anthropic.com", "api.anthropic.com"]);
    expect(defaultReachabilityTargets[0].url).toBe("https://claude.ai/cdn-cgi/trace");
  });
});

describe("summarizeReachability", () => {
  it("summarizes full, partial, and missing reachability", () => {
    expect(summarizeReachability([result({}), result({ signalId: "apiReachability", latencyMs: 300 })])).toEqual({
      reachableCount: 2,
      total: 2,
      status: "all",
      fastestMs: 100,
    });
    expect(summarizeReachability([result({}), result({ signalId: "apiReachability", status: "timeout", latencyMs: null })])).toEqual({
      reachableCount: 1,
      total: 2,
      status: "partial",
      fastestMs: 100,
    });
    expect(summarizeReachability([result({ status: "error", latencyMs: null })])).toEqual({
      reachableCount: 0,
      total: 1,
      status: "none",
      fastestMs: null,
    });
  });
});

describe("reachabilityLatencyLevel", () => {
  it.each([
    [null, null],
    [200, "low"],
    [799, "low"],
    [800, "medium"],
    [1799, "medium"],
    [1800, "high"],
  ] as const)("maps %s ms to %s", (ms, expected) => {
    expect(reachabilityLatencyLevel(ms)).toBe(expected);
  });
});
