// CheckCC 的信号合并工具，把浏览器信号、网络层探测结果和默认信号列表合并成页面展示用的信号视图。
import { defaultSignals, type SignalView } from "./client-engine";
import { detectionConfig, getSignalWeight, type DetectionConfig } from "./config";
import type { NetworkIntel } from "./ip-intel";
import { classifyIpType } from "./ip-type";
import { compareIpv6Egress, type Ipv6ProbeResult } from "./ipv6";
import { countryDisplayName, type DetectorLocaleText } from "./locale";
import { reachabilityLatencyLevel, summarizeReachability, type ReachabilityResult } from "./reachability";
import { countryRisk } from "./scoring";
import type { RegionCode, SignalResult } from "./types";
import { analyzeWebRtc, compareTimezones, type WebRtcProbeResult } from "./webrtc";
import type { LocaleCode } from "@/i18n/messages";

export type NetworkState = "idle" | "checking" | "ok" | "failed" | "disabled";

export type MergeSignalsInput = {
  browserSignals: SignalResult[];
  networkUsed: boolean;
  networkState: NetworkState;
  networkIntel: NetworkIntel | null;
  // 对应服务关闭时传 null。
  webrtcProbe: WebRtcProbeResult | null;
  ipv6Probe: Ipv6ProbeResult | null;
  reachabilityProbe: ReachabilityResult[] | null;
  region: RegionCode;
  locale: LocaleCode;
  text: DetectorLocaleText;
  progress: number;
  activeSignal: number;
  config?: DetectionConfig;
};

export function mergeSignals(input: MergeSignalsInput): SignalView[] {
  const { browserSignals, networkUsed, networkState, networkIntel, webrtcProbe, ipv6Probe, reachabilityProbe, region, locale, text: detectorText, progress, activeSignal, config = detectionConfig } = input;
  const map = new Map<string, SignalResult>();
  for (const signal of browserSignals) map.set(signal.id, signal);

  if (networkUsed) {
    const webrtcAnalysis = webrtcProbe ? analyzeWebRtc(webrtcProbe, networkIntel?.ip ?? null) : null;

    if (networkIntel) {
      const code = networkIntel.countryCode?.toUpperCase() ?? null;
      if (code) {
        const weight = getSignalWeight("country", 20, config);
        const match = countryRisk(code, region);
        map.set("country", {
          id: "country",
          label: detectorText.signalLabels.country,
          value: `${countryDisplayName(code, locale)} (${code})`,
          score: match.score,
          weight,
          contribution: Math.round(match.score * weight),
          source: "network",
          evaluated: true,
        });
      }
      map.set("ipAddress", { id: "ipAddress", label: detectorText.signalLabels.ipAddress, value: networkIntel.ip, score: 0, weight: 0, contribution: 0, source: "network", evaluated: true });
      const location = [networkIntel.city, networkIntel.region].filter(Boolean).join(" / ");
      if (location) map.set("browserIpLocation", { id: "browserIpLocation", label: detectorText.signalLabels.browserIpLocation, value: location, score: 0, weight: 0, contribution: 0, source: "network", evaluated: true });
      if (networkIntel.asn) map.set("browserIpAsn", { id: "browserIpAsn", label: detectorText.signalLabels.browserIpAsn, value: networkIntel.asn, score: 0, weight: 0, contribution: 0, source: "network", evaluated: true });
      const organization = networkIntel.org || networkIntel.isp;
      if (organization) map.set("browserIpOrg", { id: "browserIpOrg", label: detectorText.signalLabels.browserIpOrg, value: organization, score: 0, weight: 0, contribution: 0, source: "network", evaluated: true });

      const ipType = classifyIpType({ asn: networkIntel.asn, org: networkIntel.org, isp: networkIntel.isp });
      map.set("ipType", {
        id: "ipType",
        label: detectorText.signalLabels.ipType,
        value: detectorText.signalValues[`ipType_${ipType}`],
        score: 0,
        weight: 0,
        contribution: 0,
        source: "network",
        evaluated: ipType !== "unknown",
      });

      const timezoneSignal = browserSignals.find((item) => item.id === "timezone");
      const browserTimezone = timezoneSignal?.evaluated === false ? null : timezoneSignal?.value ?? null;
      const timezoneMatch = networkIntel.timezone && browserTimezone ? compareTimezones(networkIntel.timezone, browserTimezone) : null;
      const ipTimezoneWeight = getSignalWeight("ipTimezone", 4, config);
      const timezoneSuffix = timezoneMatch === null ? "" : ` · ${timezoneMatch ? detectorText.signalValues.ipTimezoneMatch : detectorText.signalValues.ipTimezoneMismatch}`;
      map.set("ipTimezone", {
        id: "ipTimezone",
        label: detectorText.signalLabels.ipTimezone,
        value: networkIntel.timezone ? `${networkIntel.timezone}${browserTimezone ? ` / ${browserTimezone}` : ""}${timezoneSuffix}` : detectorText.notEvaluated,
        score: timezoneMatch === false ? 1 : 0,
        weight: ipTimezoneWeight,
        contribution: timezoneMatch === false ? ipTimezoneWeight : 0,
        source: "network",
        evaluated: timezoneMatch !== null,
      });
    }

    if (webrtcProbe) {
      const webrtcWeight = getSignalWeight("webrtc", 18, config);
      let webrtcValue = detectorText.notEvaluated;
      let webrtcScore = 0;
      let webrtcEvaluated = false;

      if (webrtcProbe.status === "unsupported") webrtcValue = detectorText.signalValues.webrtcUnsupported;
      else if (webrtcProbe.status === "timeout") webrtcValue = detectorText.signalValues.webrtcTimeout;
      else if (webrtcProbe.status === "error") webrtcValue = detectorText.signalValues.webrtcError;
      else if (!webrtcProbe.publicAddresses.length) webrtcValue = detectorText.signalValues.webrtcNoPublic;
      else {
        const addresses = webrtcProbe.publicAddresses.join(", ");
        if (!networkIntel) {
          webrtcValue = `${addresses} · ${detectorText.signalValues.exitUnknown}`;
        } else if (webrtcAnalysis?.matchesHttp === null) {
          webrtcValue = `${addresses} · ${detectorText.signalValues.webrtcNoCompare}`;
        } else {
          webrtcScore = webrtcAnalysis?.matchesHttp ? 0 : 1;
          webrtcEvaluated = true;
          const extra = webrtcAnalysis?.extraAddresses.length ? ` · ${detectorText.signalValues.exitExtra.replace("{addresses}", webrtcAnalysis.extraAddresses.join(", "))}` : "";
          webrtcValue = `${addresses} · ${webrtcScore ? detectorText.signalValues.webrtcMismatch : detectorText.signalValues.webrtcMatch}${extra}`;
        }
      }

      map.set("webrtc", {
        id: "webrtc",
        label: detectorText.signalLabels.webrtc,
        value: webrtcValue,
        score: webrtcScore,
        weight: webrtcWeight,
        contribution: Math.round(webrtcScore * webrtcWeight),
        source: "network",
        evaluated: webrtcEvaluated,
      });

      if (networkIntel && webrtcProbe.status === "ok") {
        const matched = webrtcAnalysis?.matchesHttp ?? null;
        map.set("exitConsistency", {
          id: "exitConsistency",
          label: detectorText.signalLabels.exitConsistency,
          value: matched === null ? detectorText.signalValues.exitUnknown : matched ? detectorText.signalValues.exitMatch : detectorText.signalValues.exitMismatch,
          score: 0,
          weight: 0,
          contribution: 0,
          source: "network",
          evaluated: matched !== null,
        });

        const ipv6Addresses = webrtcAnalysis?.ipv6PublicAddresses ?? [];
        const ipv6Leak = webrtcAnalysis?.ipv6Leak ?? null;
        let ipv6Value = detectorText.signalValues.ipv6Unknown;
        if (ipv6Leak !== null) {
          if (!ipv6Addresses.length) ipv6Value = detectorText.signalValues.ipv6None;
          else if (ipv6Leak) ipv6Value = `${ipv6Addresses.join(", ")} · ${networkIntel.ip.includes(":") ? detectorText.signalValues.ipv6Diff : detectorText.signalValues.ipv6Separate}`;
          else ipv6Value = `${ipv6Addresses.join(", ")} · ${detectorText.signalValues.ipv6Same}`;
        }
        map.set("ipv6Leak", {
          id: "ipv6Leak",
          label: detectorText.signalLabels.ipv6Leak,
          value: ipv6Value,
          score: 0,
          weight: 0,
          contribution: 0,
          source: "network",
          evaluated: ipv6Leak !== null,
        });
      }
    }

    if (ipv6Probe) {
      let ipv6Value = detectorText.signalValues.ipv6EgressInvalid;
      let ipv6Evaluated = false;
      if (ipv6Probe.status === "ok") {
        const comparison = compareIpv6Egress(ipv6Probe.ip, networkIntel?.ip ?? null);
        if (comparison === "match") ipv6Value = `${ipv6Probe.ip} · ${detectorText.signalValues.ipv6EgressMatch}`;
        else if (comparison === "mismatch") ipv6Value = `${ipv6Probe.ip} · ${detectorText.signalValues.ipv6EgressMismatch}`;
        else if (comparison === "different_family") ipv6Value = `${ipv6Probe.ip} · ${detectorText.signalValues.ipv6EgressDifferentFamily}`;
        else ipv6Value = ipv6Probe.ip;
        ipv6Evaluated = true;
      } else if (ipv6Probe.reason === "timeout") ipv6Value = detectorText.signalValues.ipv6EgressTimeout;
      else if (ipv6Probe.reason === "network") ipv6Value = detectorText.signalValues.ipv6EgressNetwork;
      map.set("ipv6Egress", {
        id: "ipv6Egress",
        label: detectorText.signalLabels.ipv6Egress,
        value: ipv6Value,
        score: 0,
        weight: 0,
        contribution: 0,
        source: "network",
        evaluated: ipv6Evaluated,
      });
    }

    if (reachabilityProbe) {
      for (const result of reachabilityProbe) {
        const level = reachabilityLatencyLevel(result.latencyMs);
        const latency = level ? ` · ${detectorText.signalValues[`latency_${level}`]}` : "";
        const value = result.status === "reachable" ? `${result.latencyMs} ms${latency}` : result.status === "timeout" ? detectorText.signalValues.reachabilityTimeout : detectorText.signalValues.reachabilityError;
        map.set(result.signalId, {
          id: result.signalId,
          label: detectorText.signalLabels[result.signalId] ?? result.host,
          value,
          score: 0,
          weight: 0,
          contribution: 0,
          source: "network",
          evaluated: result.status === "reachable",
        });
      }
      const summary = summarizeReachability(reachabilityProbe);
      const fastest = summary.fastestMs === null ? "" : ` · ${detectorText.signalValues.reachabilityFastest.replace("{ms}", String(summary.fastestMs))}`;
      const statusText = summary.status === "all" ? detectorText.signalValues.reachabilityAll : summary.status === "partial" ? detectorText.signalValues.reachabilityPartial : detectorText.signalValues.reachabilityNone;
      map.set("anthropicEndpointSummary", {
        id: "anthropicEndpointSummary",
        label: detectorText.signalLabels.anthropicEndpointSummary,
        value: `${summary.reachableCount}/${summary.total} · ${statusText}${fastest}`,
        score: 0,
        weight: 0,
        contribution: 0,
        source: "network",
        evaluated: summary.status === "all",
      });
    }
  }

  const independentNetworkIds = new Set(["ipv6Egress", "claudeAiReachability", "anthropicSiteReachability", "apiReachability", "anthropicEndpointSummary"]);
  const visibleDefaults = defaultSignals.filter((item) => {
    if (item.source !== "server" && item.source !== "network") return true;
    if (!networkUsed) return false;
    return networkState !== "failed" || item.weight > 0 || independentNetworkIds.has(item.id);
  });

  const merged = visibleDefaults.map((item, index) => {
    const found = map.get(item.id);
    const label = detectorText.signalLabels[item.id] ?? item.label;
    if (!found) {
      const state = progress === 100 ? "unavailable" : index === activeSignal ? "running" : "pending";
      const value = progress === 100 ? (item.id === "country" && networkState === "failed" ? detectorText.network.unavailable : detectorText.notEvaluated) : detectorText.pending;
      return { ...item, label, value, state } as SignalView;
    }
    return { ...item, ...found, label: found.label || label, state: found.evaluated === false ? "unknown" : "done" } as SignalView;
  });
  for (const signal of map.values()) {
    if (!visibleDefaults.some((item) => item.id === signal.id)) merged.push({ ...signal, state: signal.evaluated === false ? "unknown" : progress === 100 ? "done" : "running" });
  }
  return merged;
}
