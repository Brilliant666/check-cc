import { afterEach, describe, expect, it, vi } from "vitest";
import { analyzeWebRtc, compareTimezones, parseIceCandidate, probeWebRtc, type WebRtcProbeResult } from "../webrtc";

function probe(publicAddresses: string[], privateAddresses: string[] = []): WebRtcProbeResult {
  return { status: "ok", candidates: [], publicAddresses, privateAddresses, timedOut: false };
}

class FakePeer {
  static instances: FakePeer[] = [];
  onicecandidate: ((event: { candidate: { candidate: string } | null }) => void) | null = null;
  onicegatheringstatechange: (() => void) | null = null;
  iceGatheringState = "new";
  closed = false;

  constructor(public config: unknown) {
    FakePeer.instances.push(this);
  }

  createDataChannel() {}

  async createOffer() {
    return { type: "offer", sdp: "v=0" };
  }

  async setLocalDescription() {
    queueMicrotask(() => {
      this.onicecandidate?.({ candidate: { candidate: "candidate:1 1 udp 2122260223 192.168.1.10 5000 typ host generation 0" } });
      this.onicecandidate?.({ candidate: { candidate: "candidate:2 1 udp 1686052607 203.0.113.9 5001 typ srflx raddr 192.168.1.10 rport 5000 generation 0" } });
      this.onicecandidate?.({ candidate: null });
      this.iceGatheringState = "complete";
      this.onicegatheringstatechange?.();
    });
  }

  close() {
    this.closed = true;
  }
}

class HangingPeer extends FakePeer {
  async setLocalDescription() {}
}

describe("parseIceCandidate", () => {
  it("parses a public srflx candidate", () => {
    expect(parseIceCandidate("candidate:842163049 1 udp 1677729535 203.0.113.5 54321 typ srflx raddr 0.0.0.0 rport 0 generation 0 network-cost 999")).toEqual({
      address: "203.0.113.5",
      port: 54321,
      protocol: "udp",
      type: "srflx",
      family: "IPv4",
    });
  });

  it("accepts browser-prefixed candidates and IPv6 addresses", () => {
    const parsed = parseIceCandidate("a=candidate:1 1 udp 2122260223 2001:db8::1 5000 typ host generation 0");

    expect(parsed).toMatchObject({ address: "2001:db8::1", port: 5000, family: "IPv6", type: "host" });
  });

  it("keeps mDNS host candidates as unknown family", () => {
    expect(parseIceCandidate("candidate:1 1 udp 2122260223 abc123.local 5000 typ host")).toMatchObject({ family: "unknown", type: "host" });
  });

  it("rejects non-candidate and malformed lines", () => {
    expect(parseIceCandidate("")).toBeNull();
    expect(parseIceCandidate("not-a-candidate")).toBeNull();
    expect(parseIceCandidate("candidate:1 1 udp 2122260223 192.168.1.10 5000")).toBeNull();
    expect(parseIceCandidate("candidate:1 1 udp 2122260223 not-an-ip 5000 typ host")).toBeNull();
  });
});

describe("analyzeWebRtc", () => {
  it("matches an IPv4 candidate with the HTTP exit", () => {
    expect(analyzeWebRtc(probe(["203.0.113.5"], ["192.168.1.10"]), "203.0.113.5")).toEqual({
      publicAddresses: ["203.0.113.5"],
      ipv6PublicAddresses: [],
      comparedAddresses: ["203.0.113.5"],
      matchesHttp: true,
      ipv6Leak: false,
    });
  });

  it("flags an IPv4 candidate that differs from the HTTP exit", () => {
    const result = analyzeWebRtc(probe(["198.51.100.7"]), "203.0.113.5");

    expect(result.matchesHttp).toBe(false);
    expect(result.ipv6Leak).toBe(false);
  });

  it("ignores IPv6 candidates when the HTTP exit is IPv4 but reports the separate egress", () => {
    const result = analyzeWebRtc(probe(["203.0.113.5", "2001:db8::1"]), "203.0.113.5");

    expect(result.matchesHttp).toBe(true);
    expect(result.comparedAddresses).toEqual(["203.0.113.5"]);
    expect(result.ipv6Leak).toBe(true);
  });

  it("compares IPv6 candidates when the HTTP exit is IPv6", () => {
    const matched = analyzeWebRtc(probe(["2001:db8::1"]), "2001:0db8:0:0:0:0:0:1");
    const mismatched = analyzeWebRtc(probe(["2001:db8::2"]), "2001:db8::1");

    expect(matched.matchesHttp).toBe(true);
    expect(matched.ipv6Leak).toBe(false);
    expect(mismatched.matchesHttp).toBe(false);
    expect(mismatched.ipv6Leak).toBe(true);
  });

  it("leaves the comparison unknown without a same-family candidate or HTTP IP", () => {
    expect(analyzeWebRtc(probe(["2001:db8::1"]), "203.0.113.5").matchesHttp).toBeNull();
    expect(analyzeWebRtc(probe(["203.0.113.5"]), null)).toEqual({ publicAddresses: ["203.0.113.5"], ipv6PublicAddresses: [], comparedAddresses: [], matchesHttp: null, ipv6Leak: null });
    expect(analyzeWebRtc(probe([]), "203.0.113.5").matchesHttp).toBeNull();
  });
});

describe("compareTimezones", () => {
  const now = new Date("2026-10-28T00:00:00Z");

  it("treats the same zone or the same UTC offset as consistent", () => {
    expect(compareTimezones("Asia/Shanghai", "Asia/Shanghai", now)).toBe(true);
    expect(compareTimezones("Asia/Hong_Kong", "Asia/Shanghai", now)).toBe(true);
    expect(compareTimezones("Europe/Moscow", "Europe/Volgograd", now)).toBe(true);
  });

  it("flags different offsets", () => {
    expect(compareTimezones("America/Phoenix", "Asia/Shanghai", now)).toBe(false);
    expect(compareTimezones("Europe/Moscow", "Asia/Shanghai", now)).toBe(false);
  });

  it("returns null when either side is missing or invalid", () => {
    expect(compareTimezones(null, "Asia/Shanghai", now)).toBeNull();
    expect(compareTimezones("Asia/Shanghai", "", now)).toBeNull();
    expect(compareTimezones("Not/AZone", "Asia/Shanghai", now)).toBeNull();
  });
});

describe("probeWebRtc", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    FakePeer.instances = [];
  });

  it("reports unsupported when RTCPeerConnection is unavailable", async () => {
    vi.stubGlobal("RTCPeerConnection", undefined);

    await expect(probeWebRtc({ timeoutMs: 50 })).resolves.toMatchObject({ status: "unsupported", publicAddresses: [], privateAddresses: [], timedOut: false });
  });

  it("collects candidates and separates public from private addresses", async () => {
    vi.stubGlobal("RTCPeerConnection", FakePeer);

    const result = await probeWebRtc({ timeoutMs: 500 });

    expect(result.status).toBe("ok");
    expect(result.publicAddresses).toEqual(["203.0.113.9"]);
    expect(result.privateAddresses).toEqual(["192.168.1.10"]);
    expect(result.candidates).toHaveLength(2);
    expect(FakePeer.instances[0].config).toEqual({ iceServers: [{ urls: "stun:stun.cloudflare.com:3478" }] });
    expect(FakePeer.instances[0].closed).toBe(true);
  });

  it("times out without candidates", async () => {
    vi.stubGlobal("RTCPeerConnection", HangingPeer);

    const result = await probeWebRtc({ timeoutMs: 10 });

    expect(result).toMatchObject({ status: "timeout", timedOut: true, publicAddresses: [] });
  });
});
