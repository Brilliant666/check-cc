import { describe, expect, it } from "vitest";
import type { NetworkIntel } from "../ip-intel";
import { detectorLocaleText } from "../locale";
import { mergeSignals, type MergeSignalsInput } from "../merge-signals";
import type { WebRtcProbeResult } from "../webrtc";

const text = detectorLocaleText.zh;

const intel: NetworkIntel = {
  ip: "203.0.113.5",
  countryCode: "CN",
  countryName: "China",
  region: "Shanghai",
  city: "Shanghai",
  asn: "AS4134",
  org: "Chinanet",
  isp: null,
  timezone: "Asia/Shanghai",
  latitude: null,
  longitude: null,
  ipType: null,
};

function webrtc(publicAddresses: string[]): WebRtcProbeResult {
  return { status: "ok", candidates: [], publicAddresses, privateAddresses: [], timedOut: false };
}

function input(overrides: Partial<MergeSignalsInput> = {}): MergeSignalsInput {
  return {
    browserSignals: [{ id: "timezone", label: "", value: "Asia/Shanghai", score: 1, weight: 26, contribution: 26, source: "browser", evaluated: true }],
    networkUsed: true,
    networkState: "ok",
    networkIntel: intel,
    webrtcProbe: null,
    ipv6Probe: null,
    reachabilityProbe: null,
    region: "auto",
    locale: "zh",
    text,
    progress: 100,
    activeSignal: 0,
    ...overrides,
  };
}

function byId(signals: ReturnType<typeof mergeSignals>) {
  return Object.fromEntries(signals.map((signal) => [signal.id, signal]));
}

describe("mergeSignals", () => {
  it("hides network rows when the network layer is off", () => {
    const signals = mergeSignals(input({ networkUsed: false, networkIntel: null, networkState: "disabled" }));

    expect(signals.some((signal) => signal.source === "network")).toBe(false);
    expect(byId(signals).timezone).toMatchObject({ state: "done", contribution: 26 });
  });

  it("scores the IP country and adds zero-weight network context", () => {
    const signals = byId(mergeSignals(input()));

    expect(signals.country).toMatchObject({ contribution: 20, state: "done" });
    expect(signals.country.value).toContain("(CN)");
    expect(signals.ipAddress).toMatchObject({ value: "203.0.113.5", weight: 0 });
    expect(signals.ipType.value).toBe(text.signalValues.ipType_carrier);
    expect(signals.ipTimezone).toMatchObject({ contribution: 0, evaluated: true });
  });

  it("scores an IP timezone whose offset differs from the browser", () => {
    const signals = byId(mergeSignals(input({ networkIntel: { ...intel, timezone: "America/New_York" } })));

    expect(signals.ipTimezone).toMatchObject({ contribution: 4, evaluated: true });
  });

  it("keeps a failed lookup from adding risk and marks the country unavailable", () => {
    const signals = byId(mergeSignals(input({ networkIntel: null, networkState: "failed" })));

    expect(signals.country).toMatchObject({ contribution: 0, state: "unavailable", value: text.network.unavailable });
  });

  it("treats a WebRTC probe with one matching exit as consistent and lists the extra exit", () => {
    const signals = byId(mergeSignals(input({ webrtcProbe: webrtc(["203.0.113.5", "198.51.100.7"]) })));

    expect(signals.webrtc).toMatchObject({ contribution: 0, evaluated: true });
    expect(signals.webrtc.value).toContain(text.signalValues.webrtcMatch);
    expect(signals.webrtc.value).toContain("198.51.100.7");
    expect(signals.exitConsistency.value).toBe(text.signalValues.exitMatch);
  });

  it("scores a WebRTC probe whose exit never matches HTTP", () => {
    const signals = byId(mergeSignals(input({ webrtcProbe: webrtc(["198.51.100.7"]) })));

    expect(signals.webrtc).toMatchObject({ contribution: 18, evaluated: true });
  });

  it("shows pending rows while the scan is still running", () => {
    const signals = mergeSignals(input({ browserSignals: [], networkIntel: null, networkState: "checking", progress: 40, activeSignal: 0 }));

    expect(signals[0].state).toBe("running");
    expect(signals.slice(1).every((signal) => signal.state === "pending")).toBe(true);
  });
});
