"use client";

// CheckCC 的浏览器端检测组件，用于执行环境扫描、展示风险信号、进度状态和检测结果。
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RegionCode, SignalResult } from "@/detection/types";
import {
  animateProgress,
  defaultSignals,
  regions,
  scanSteps,
  sleep,
  summarizeSignals,
  type SignalView,
} from "@/detection/client-engine";
import { countryDisplayName, detectorLocaleText, type DetectorLocaleText } from "@/detection/locale";
import { detectionConfig } from "@/detection/config";
import { lookupNetworkIntel, providerHost, type NetworkIntel } from "@/detection/ip-intel";
import { buildJsonReport, buildTextReport, reportFilename } from "@/detection/report";
import { analyzeWebRtc, compareTimezones, probeWebRtc, type WebRtcProbeResult } from "@/detection/webrtc";
import { compareIpv6Egress, probeIpv6Egress, type Ipv6ProbeResult } from "@/detection/ipv6";
import { classifyIpType } from "@/detection/ip-type";
import { defaultReachabilityTargets, probeReachability, reachabilityLatencyLevel, summarizeReachability, type ReachabilityResult } from "@/detection/reachability";
import { runDetection, type DetectionRunResult } from "@/detection/runner";
import { countryRisk, riskLevel } from "@/detection/scoring";
import { messages, type LocaleCode } from "@/i18n/messages";
import { cgClaudeRepoUrl } from "@/site-config";
import { FixCta } from "@/components/detector/FixCta";

type Props = { lang?: "zh" | "en"; locale?: LocaleCode };

function ScoreRing({ score, checked, text }: { score: number; checked: boolean; text: DetectorLocaleText }) {
  const deg = checked ? Math.max(0, Math.min(100, score)) * 3.6 : 0;
  const level = riskLevel(score);
  const ringColor = !checked ? "#d6d3d1" : level === "none" ? "#059669" : level === "high" ? "#dc2626" : level === "medium" ? "#d97757" : "#f59e0b";
  return (
    <div className="relative grid size-44 place-items-center rounded-full bg-white shadow-2xl shadow-red-950/10" style={{ background: `conic-gradient(${ringColor} ${deg}deg, #e7e5df 0deg)` }}>
      <div className="grid h-[8.5rem] w-[8.5rem] place-items-center rounded-full bg-white shadow-inner">
        <div className="text-center">
          <div className="text-5xl font-black text-[#0b1220]">{checked ? score : "--"}</div>
          {checked && <div className="text-xs font-bold text-stone-400">/ 100</div>}
          <div className="text-xs font-bold tracking-[0.2em] text-stone-500">{checked ? text.risk.scoreLabel : text.risk.waiting}</div>
        </div>
      </div>
    </div>
  );
}

function signalTone(signal: SignalView) {
  if (signal.state === "pending" || signal.state === "unavailable") return "border-stone-200 bg-stone-50 text-stone-400";
  if (signal.state === "unknown") return "border-stone-200 bg-stone-50 text-stone-500";
  if (signal.state === "running") return "border-sky-300 bg-sky-50 text-sky-700 shadow-md shadow-sky-900/10";
  if (signal.contribution > 0) return "border-red-500 bg-red-600 text-white shadow-lg shadow-red-900/30 [animation:risk-card-pulse_1.2s_ease-in-out_infinite]";
  return "border-emerald-300 bg-emerald-50 text-emerald-700";
}

function signalLabelTone(signal: SignalView) {
  return signal.contribution > 0 && signal.state === "done" ? "text-white" : "text-[#0b1220]";
}

function signalBadgeTone(signal: SignalView) {
  return signal.contribution > 0 && signal.state === "done" ? "bg-white text-red-600" : "bg-white/70";
}

function SignalList({ signals }: { signals: SignalView[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-2 lg:min-h-[216px] lg:content-between xl:grid-cols-3 2xl:grid-cols-4">
      {signals.map((signal) => (
        <div key={`${signal.source}-${signal.id}`} className={`rounded-xl border px-3 py-2 transition ${signalTone(signal)}`}>
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className={`truncate text-sm font-semibold ${signalLabelTone(signal)}`}>{signal.label}</div>
              <div className="truncate text-xs font-semibold opacity-90">{signal.value}</div>
            </div>
            <div className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${signalBadgeTone(signal)}`}>{signal.state === "done" ? `+${signal.contribution}` : "--"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Detector({ locale = "zh" }: Props) {
  const copy = messages[locale].detector;
  const detectorText = detectorLocaleText[locale];
  const ipIntelConfig = detectionConfig.services.ipIntel;
  const webrtcConfig = detectionConfig.services.webrtc;
  const ipv6Config = detectionConfig.services.ipv6;
  const reachabilityConfig = detectionConfig.services.reachability;
  const ipIntelAvailable = Boolean(ipIntelConfig?.enabled);
  const networkProvider = ipIntelConfig ? providerHost(ipIntelConfig.endpoint) : "";
  const networkFallbackProvider = ipIntelConfig?.fallbackEndpoint ? providerHost(ipIntelConfig.fallbackEndpoint) : "";
  const networkProviderChain = Array.from(new Set([networkProvider, networkFallbackProvider].filter(Boolean))).join(" → ");
  const [region, setRegion] = useState<RegionCode>("auto");
  const [browserResult, setBrowserResult] = useState<DetectionRunResult["browserResult"] | null>(null);
  const [networkIntel, setNetworkIntel] = useState<NetworkIntel | null>(null);
  const [webrtcProbe, setWebrtcProbe] = useState<WebRtcProbeResult | null>(null);
  const [reachabilityProbe, setReachabilityProbe] = useState<ReachabilityResult[] | null>(null);
  const [ipv6Probe, setIpv6Probe] = useState<Ipv6ProbeResult | null>(null);
  const [networkEnabled, setNetworkEnabled] = useState(false);
  const [networkUsed, setNetworkUsed] = useState(false);
  const [networkProviderLabel, setNetworkProviderLabel] = useState("");
  const [networkState, setNetworkState] = useState<"idle" | "checking" | "ok" | "failed" | "disabled">("disabled");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSignal, setActiveSignal] = useState(-1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const runningRef = useRef(false);
  const runTokenRef = useRef(0);

  const signals = useMemo<SignalView[]>(() => {
    const map = new Map<string, SignalResult>();
    for (const signal of browserResult?.signals ?? []) map.set(signal.id, signal);

    if (networkUsed) {
      const webrtcAnalysis = webrtcConfig?.enabled && webrtcProbe ? analyzeWebRtc(webrtcProbe, networkIntel?.ip ?? null) : null;

      if (networkIntel) {
        const code = networkIntel.countryCode?.toUpperCase() ?? null;
        if (code) {
          const weight = detectionConfig.signals.country.weight;
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

        const timezoneSignal = browserResult?.signals.find((item) => item.id === "timezone");
        const browserTimezone = timezoneSignal?.evaluated === false ? null : timezoneSignal?.value ?? null;
        const timezoneMatch = networkIntel.timezone && browserTimezone ? compareTimezones(networkIntel.timezone, browserTimezone) : null;
        const ipTimezoneWeight = detectionConfig.signals.ipTimezone.weight;
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

      if (webrtcConfig?.enabled && webrtcProbe) {
        const webrtcWeight = detectionConfig.signals.webrtc.weight;
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

      if (ipv6Config?.enabled && ipv6Probe) {
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

      if (reachabilityConfig?.enabled && reachabilityProbe) {
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
  }, [browserResult, networkIntel, webrtcProbe, reachabilityProbe, ipv6Probe, webrtcConfig, ipv6Config, reachabilityConfig, networkUsed, networkState, region, activeSignal, progress, detectorText, locale]);

  const scoreSummary = useMemo(() => summarizeSignals(signals), [signals]);
  const rawScore = scoreSummary.score;
  const coverage = scoreSummary.coverage;
  const fullCoverage = scoreSummary.totalCount > 0 && scoreSummary.evaluatedCount === scoreSummary.totalCount;
  const animatedScore = loading ? Math.round((rawScore * progress) / 100) : rawScore;
  const level = riskLevel(rawScore);
  const status = level === "high" ? "restricted" : level === "medium" ? "possibly_supported" : level === "low" ? "unknown" : fullCoverage ? "supported" : "unknown";
  const pageRegionCode: RegionCode = region !== "auto" ? region : locale === "zh-HK" ? "hk" : locale === "ru" ? "ru" : "cn";
  const networkMatchedRegion = networkUsed && networkIntel ? countryRisk(networkIntel.countryCode, region).matchedRegion : null;
  const detectedRegionCode: RegionCode = browserResult?.matchedRegion ?? networkMatchedRegion ?? pageRegionCode;
  const pageRegion = detectorText.regions[detectedRegionCode];
  const russianSummaryRegions: Record<RegionCode, string> = { auto: "российской", cn: "китайской", hk: "гонконгской", ru: "российской", ir: "иранской" };
  const suspectedRegion = locale === "ru" ? russianSummaryRegions[detectedRegionCode] : pageRegion;
  const confidenceText = level === "none" ? detectorText.confidence.safe : detectorText.confidence[level];
  const environmentSuffix = locale === "ru" ? "среды" : copy.environmentSuffix;
  const limitationText = !networkUsed ? detectorText.recommendations.limitation : networkState === "ok" ? detectorText.recommendations.limitationNetwork : detectorText.recommendations.limitationNetworkFailed;
  const recommendationList = [
    coverage < 100 ? detectorText.recommendations.incomplete : null,
    level === "none" ? detectorText.recommendations.low : detectorText.recommendations[level],
    limitationText,
  ].filter((item): item is string => Boolean(item));

  const reportInput = () => ({
    text: detectorText,
    summary: scoreSummary,
    signals,
    score: rawScore,
    statusLabel: detectorText.status[status],
    riskLabel,
    regionLabel: rawScore > 0 ? pageRegion : detectorText.regions[region],
    targetLabel: detectorText.regions[region],
    recommendations: recommendationList,
    limitation: limitationText,
  });

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(buildTextReport(reportInput()));
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    window.setTimeout(() => setCopyState("idle"), 2000);
  };

  const downloadReport = () => {
    const generatedAt = new Date();
    const blob = new Blob([buildJsonReport({ ...reportInput(), generatedAt })], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = reportFilename(generatedAt);
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const hasChecked = progress === 100;
  const ringActive = loading || progress > 0;
  const animatedLevel = riskLevel(animatedScore);
  const riskLabel = !ringActive ? detectorText.risk.waiting : !hasChecked ? detectorText.risk.checking : animatedLevel === "none" ? (fullCoverage ? detectorText.risk.supported : detectorText.risk.unknown) : animatedLevel === "high" ? detectorText.risk.blocked : animatedLevel === "medium" ? detectorText.risk.high : detectorText.risk.light;
  const riskLabelClass = !ringActive ? "bg-stone-100 text-stone-500" : !hasChecked ? "bg-blue-50 text-blue-600" : animatedLevel === "none" ? "bg-emerald-50 text-emerald-700" : animatedLevel === "high" ? "bg-red-50 text-red-600" : animatedLevel === "medium" ? "bg-orange-50 text-orange-700" : "bg-amber-50 text-amber-700";
  const networkNoteTemplate = !networkUsed
    ? detectorText.network.disabled
    : !hasChecked
      ? networkState === "checking" ? detectorText.network.checking : detectorText.network.idle
      : networkState === "ok"
        ? detectorText.network.success
        : networkState === "failed"
          ? detectorText.network.failed
          : detectorText.network.idle;
  const networkNoteProvider = networkState === "ok" || networkState === "failed" ? networkProviderLabel || networkProviderChain : networkProvider;
  const networkNote = networkNoteTemplate.replaceAll("{provider}", networkNoteProvider);

  useEffect(
    () => () => {
      runTokenRef.current += 1;
      runningRef.current = false;
      window.dispatchEvent(new CustomEvent("checkcc-running", { detail: false }));
    },
    [],
  );

  const runCheck = useCallback(async (options?: { network?: boolean }) => {
    if (runningRef.current) return;
    runningRef.current = true;
    const token = runTokenRef.current + 1;
    runTokenRef.current = token;
    const activeRegion = region;
    setSettingsOpen(false);
    setLoading(true);
    setBrowserResult(null);
    setNetworkIntel(null);
    setWebrtcProbe(null);
    setReachabilityProbe(null);
    setIpv6Probe(null);
    setNetworkProviderLabel("");
    setProgress(0);
    setActiveSignal(0);
    window.dispatchEvent(new CustomEvent("checkcc-running", { detail: true }));

    const useNetwork = (options?.network ?? networkEnabled) && ipIntelAvailable;
    setNetworkUsed(useNetwork);
    setNetworkState(useNetwork ? "checking" : "disabled");

    let local: DetectionRunResult["browserResult"] | null = null;

    try {
      for (let index = 0; index < scanSteps.length; index += 1) {
        if (runTokenRef.current !== token) return;
        const from = Math.round((index / scanSteps.length) * 92);
        const to = Math.round(((index + 1) / scanSteps.length) * 92);

        if (index === 0) {
          const result = await runDetection({ region: activeRegion, text: detectorText, config: detectionConfig });
          if (runTokenRef.current !== token) return;
          local = result.browserResult;
          setBrowserResult(local);
        }

        const progressAnimation = animateProgress(from, to, setProgress, setActiveSignal);
        if (index === 2 && useNetwork && ipIntelConfig) {
          const probeTask = webrtcConfig?.enabled
            ? probeWebRtc({ stunUrl: webrtcConfig.endpoint, timeoutMs: webrtcConfig.timeoutMs })
            : Promise.resolve(null);
          const ipv6Task = ipv6Config?.enabled ? probeIpv6Egress({ endpoint: ipv6Config.endpoint, timeoutMs: ipv6Config.timeoutMs }) : Promise.resolve(null);
          const reachabilityTask = reachabilityConfig?.enabled
            ? probeReachability({
                targets: defaultReachabilityTargets.map((target) => (target.signalId === "claudeAiReachability" ? { ...target, url: reachabilityConfig.endpoint } : target)),
                timeoutMs: reachabilityConfig.timeoutMs,
              })
            : Promise.resolve(null);
          const [lookup, probe, ipv6, reachability] = await Promise.all([
            lookupNetworkIntel({ endpoint: ipIntelConfig.endpoint, fallbackEndpoint: ipIntelConfig.fallbackEndpoint, timeoutMs: ipIntelConfig.timeoutMs }),
            probeTask,
            ipv6Task,
            reachabilityTask,
            progressAnimation,
          ]);
          if (runTokenRef.current !== token) return;
          setWebrtcProbe(probe);
          setIpv6Probe(ipv6);
          setReachabilityProbe(reachability);
          if (lookup.status === "ok") {
            setNetworkIntel(lookup.intel);
            setNetworkProviderLabel(lookup.provider);
            setNetworkState("ok");
          } else {
            setNetworkProviderLabel(lookup.providers.join(" → "));
            setNetworkState("failed");
          }
        } else {
          await progressAnimation;
        }
        if (runTokenRef.current !== token) return;
        await sleep(45);
      }

      if (!local) {
        const result = await runDetection({ region: activeRegion, text: detectorText, config: detectionConfig });
        if (runTokenRef.current !== token) return;
        setBrowserResult(result.browserResult);
      }

      await animateProgress(92, 100, setProgress, setActiveSignal);
      if (runTokenRef.current !== token) return;
      setActiveSignal(defaultSignals.length);
    } finally {
      if (runTokenRef.current === token) {
        setLoading(false);
        runningRef.current = false;
        window.dispatchEvent(new CustomEvent("checkcc-running", { detail: false }));
      }
    }
  }, [region, networkEnabled, ipIntelAvailable, ipIntelConfig, webrtcConfig, ipv6Config, reachabilityConfig, detectorText]);

  const enableNetworkAndRerun = () => {
    if (runningRef.current || !ipIntelAvailable) return;
    setNetworkEnabled(true);
    void runCheck({ network: true });
  };

  const changeRegion = (code: RegionCode) => {
    if (code === region) return;
    setRegion(code);
    setBrowserResult(null);
    setNetworkIntel(null);
    setWebrtcProbe(null);
    setReachabilityProbe(null);
    setIpv6Probe(null);
    setNetworkProviderLabel("");
    setNetworkState("idle");
    setNetworkUsed(networkEnabled && ipIntelAvailable);
    setProgress(0);
    setActiveSignal(-1);
    setCopyState("idle");
  };

  const runCheckRef = useRef(runCheck);
  useEffect(() => {
    runCheckRef.current = runCheck;
  }, [runCheck]);

  useEffect(() => {
    const start = () => {
      if (runningRef.current) return;
      document.getElementById("checker")?.scrollIntoView({ behavior: "smooth", block: "start" });
      void runCheckRef.current();
    };
    window.addEventListener("start-detection", start);
    return () => window.removeEventListener("start-detection", start);
  }, []);

  return (
    <section className="mx-auto p-0">
      <div className="sticky top-[72px] z-40 py-4">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-3 pb-2 md:flex-row md:justify-center md:gap-10 xl:max-w-[1280px] min-[1800px]:max-w-[1560px] min-[2400px]:max-w-[1800px]">
          {copy.cardTags.map((title, index) => [title, ["bg-[#d97757]", "bg-red-500", "bg-emerald-500"][index]] as const).map(([title, color]) => (
            <div key={title} className="group flex items-center gap-3 text-lg font-black text-[#0b1220] md:text-2xl">
              <span className={`size-2.5 rounded-full ${color} shadow-[0_0_18px_rgba(217,119,87,0.45)]`} />
              <span className="relative whitespace-nowrap after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-[#d97757] after:transition group-hover:after:scale-x-100">
                {title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-5 w-full text-center">
        <button type="button" onClick={() => void runCheck()} disabled={loading} className="h-14 w-full cursor-pointer rounded-full bg-[#d97757] px-8 text-lg font-black text-white shadow-xl shadow-orange-900/20 transition hover:bg-[#c05f3c] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:min-w-[360px]">
          {loading ? copy.loadingText : copy.idleCta}
        </button>
        <div className="mt-4 flex flex-col items-center gap-2">
          <button type="button" onClick={() => setSettingsOpen((value) => !value)} aria-expanded={settingsOpen} aria-controls="detector-settings" className="inline-flex flex-wrap items-center justify-center gap-1.5 rounded-full border border-stone-300 bg-white/70 px-4 py-2 text-xs font-bold text-stone-600 transition hover:border-[#d97757] hover:text-[#c05f3c]">
            <span>{detectorText.settings.label}</span>
            <span className="text-stone-400">·</span>
            <span>{detectorText.regions[region]}</span>
            <span className="text-stone-400">·</span>
            <span>{networkEnabled ? detectorText.settings.networkOn : detectorText.settings.networkOff}</span>
            <svg viewBox="0 0 24 24" className={`size-4 transition-transform ${settingsOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m6 9 6 6 6-6" /></svg>
          </button>
          {settingsOpen && (
            <div id="detector-settings" className="w-full max-w-xl rounded-3xl border border-stone-200 bg-white p-4 text-left shadow-lg shadow-orange-950/5">
              <p className="text-sm font-black text-[#0b1220]">{copy.targetTitle}</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-stone-500">{copy.targetDesc}</p>
              <div role="group" aria-label={copy.targetTitle} className="mt-3 grid grid-cols-3 gap-2">
                {regions.map((item) => (
                  <button key={item.code} type="button" aria-pressed={region === item.code} disabled={loading} onClick={() => changeRegion(item.code)} className={`rounded-xl border px-2 py-2.5 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-60 ${region === item.code ? "border-[#d97757] bg-orange-50 text-[#c05f3c]" : "border-stone-200 bg-white text-[#0b1220] hover:border-stone-300"}`}>
                    {detectorText.regions[item.code]}
                  </button>
                ))}
              </div>
              {ipIntelAvailable && (
                <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-2xl bg-stone-50 px-4 py-3 ring-1 ring-stone-200">
                  <input type="checkbox" checked={networkEnabled} disabled={loading} onChange={(event) => setNetworkEnabled(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[#d97757]" />
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-[#0b1220]">{detectorText.network.toggleLabel}</span>
                    <span className="mt-0.5 block text-xs font-semibold leading-5 text-stone-500">{detectorText.network.toggleHint.replaceAll("{provider}", networkProviderChain)}</span>
                    {networkFallbackProvider && (
                      <span className="mt-0.5 block text-xs font-semibold leading-5 text-stone-500">{detectorText.network.fallbackHint.replaceAll("{fallback}", networkFallbackProvider)}</span>
                    )}
                  </span>
                </label>
              )}
              {hasChecked && <p className="mt-3 text-xs font-semibold leading-5 text-stone-500">{detectorText.settings.changeHint}</p>}
            </div>
          )}
        </div>
        <div className="relative mt-10 text-center font-black" role="status" aria-live="polite" aria-atomic="true">
          <div className="py-3 leading-tight md:py-4">
            {hasChecked ? (
              rawScore === 0 && !fullCoverage ? (
                <div className="text-2xl text-[#0b1220] md:text-3xl">{detectorText.coverageInsufficient}</div>
              ) : (
                <>
                  <div className="text-2xl text-[#0b1220] md:inline md:text-3xl">
                    <span>{confidenceText}</span>
                    {rawScore > 0 && (
                      <>
                        <span className="mx-1 text-[#d97757]">{suspectedRegion}</span>
                        <span>{environmentSuffix}</span>
                      </>
                    )}
                    <span className="hidden md:inline">：</span>
                  </div>
                  <div className="mt-2 text-2xl md:mt-0 md:inline md:text-3xl">
                    <span className="text-stone-600">{copy.riskPrefix}</span>
                    <span className="mx-1 text-red-600">{animatedScore} / 100</span>
                    <span className="text-stone-400">·</span>
                    <span className="ml-2 text-[#c05f3c]">{detectorText.status[status]}</span>
                  </div>
                </>
              )
            ) : (
              <div className="text-2xl text-[#0b1220] md:text-3xl">{copy.idleReport}</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[2rem] border border-stone-200 bg-white/80 p-4 shadow-xl shadow-orange-950/5 md:p-6">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr]">
          <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-5">
            <ScoreRing score={animatedScore} checked={ringActive} text={detectorText} />
            <div className="mt-3 text-xs font-bold text-stone-500">{detectorText.coverageLabel} {hasChecked ? `${coverage}% (${scoreSummary.evaluatedCount}/${scoreSummary.totalCount})` : "--"}</div>
            <div className={`mt-3 rounded-full px-4 py-2 text-sm font-bold ${riskLabelClass}`}>{riskLabel}</div>
            {hasChecked && <FixCta text={detectorText.fix} url={cgClaudeRepoUrl} />}
          </div>
          <div>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-black text-[#0b1220]">{copy.title}</h3>
              <span className="rounded-full bg-[#fffaf3] px-3 py-1 text-xs font-bold text-stone-500">{hasChecked ? copy.signalHitSummary(scoreSummary.hitCount, scoreSummary.totalCount) : copy.signalCount(signals.length, false)}</span>
            </div>
            <div className="mt-2 md:mt-4"><SignalList signals={signals} /></div>
            <div className="mt-3 rounded-xl bg-stone-50 px-3 py-2 ring-1 ring-stone-200">
              <p role="status" className="text-xs font-semibold leading-5 text-stone-500">{networkNote}</p>
              {hasChecked && !networkUsed && ipIntelAvailable && (
                <button type="button" onClick={enableNetworkAndRerun} disabled={loading} className="mt-2 cursor-pointer rounded-full border border-[#d97757] bg-white px-3 py-1.5 text-xs font-bold text-[#c05f3c] transition hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60">
                  {detectorText.network.enableAndRetry}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {hasChecked && (
        <div className="mt-5 rounded-[2rem] border border-stone-200 bg-white/80 p-5 shadow-xl shadow-orange-950/5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-black text-[#0b1220]">{detectorText.recommendationsTitle}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={copyReport} className="cursor-pointer rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-600 transition hover:border-[#d97757] hover:text-[#c05f3c]" aria-live="polite">
                {copyState === "copied" ? detectorText.report.copied : copyState === "failed" ? detectorText.report.copyFailed : detectorText.report.copy}
              </button>
              <button type="button" onClick={downloadReport} className="cursor-pointer rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-600 transition hover:border-[#d97757] hover:text-[#c05f3c]">
                {detectorText.report.download}
              </button>
            </div>
          </div>
          <ul className="mt-3 grid gap-2 text-sm font-semibold leading-6 text-stone-600 md:grid-cols-2">
            {recommendationList.map((item) => (
              <li key={item} className="rounded-xl bg-[#fffaf3] px-3 py-2 ring-1 ring-stone-200">{item}</li>
            ))}
          </ul>
        </div>
      )}

    </section>
  );
}
