"use client";

// CheckCC 的浏览器端检测组件，用于执行环境扫描、展示风险信号、进度状态和检测结果。
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { countryDisplayName, detectorLocaleText, type DetectorLocaleText, type TargetRegion } from "@/detection/locale";
import { detectionConfig } from "@/detection/config";
import { lookupNetworkIntel, providerHost, type NetworkIntel } from "@/detection/ip-intel";
import { buildJsonReport, buildTextReport, reportFilename } from "@/detection/report";
import { runDetection, type DetectionRunResult } from "@/detection/runner";
import { countryRisk } from "@/detection/scoring";
import { messages, type LocaleCode } from "@/i18n/messages";

type Props = { lang?: "zh" | "en"; locale?: LocaleCode };

function ScoreRing({ score, checked, text }: { score: number; checked: boolean; text: DetectorLocaleText }) {
  const deg = checked ? Math.max(0, Math.min(100, score)) * 3.6 : 0;
  const ringColor = !checked ? "#d6d3d1" : score === 0 ? "#059669" : score >= 70 ? "#dc2626" : score >= 31 ? "#d97757" : "#f59e0b";
  return (
    <div className="relative grid size-44 place-items-center rounded-full bg-white shadow-2xl shadow-red-950/10" style={{ background: `conic-gradient(${ringColor} ${deg}deg, #e7e5df 0deg)` }}>
      <div className="grid h-[8.5rem] w-[8.5rem] place-items-center rounded-full bg-white shadow-inner">
        <div className="text-center">
          <div className="text-5xl font-black text-[#0b1220]">{checked ? `${score}%` : "--"}</div>
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
  const ipIntelAvailable = Boolean(ipIntelConfig?.enabled);
  const networkProvider = ipIntelConfig ? providerHost(ipIntelConfig.endpoint) : "";
  const [region, setRegion] = useState<RegionCode>("auto");
  const [browserResult, setBrowserResult] = useState<DetectionRunResult["browserResult"] | null>(null);
  const [networkIntel, setNetworkIntel] = useState<NetworkIntel | null>(null);
  const [networkEnabled, setNetworkEnabled] = useState(ipIntelAvailable);
  const [networkUsed, setNetworkUsed] = useState(ipIntelAvailable);
  const [networkState, setNetworkState] = useState<"idle" | "checking" | "ok" | "failed" | "disabled">("idle");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeSignal, setActiveSignal] = useState(-1);
  const [showRegionPicker, setShowRegionPicker] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const pickerRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const runningRef = useRef(false);
  const runTokenRef = useRef(0);

  const signals = useMemo<SignalView[]>(() => {
    const map = new Map<string, SignalResult>();
    for (const signal of browserResult?.signals ?? []) map.set(signal.id, signal);

    if (networkUsed && networkIntel) {
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
    }

    const visibleDefaults = defaultSignals.filter((item) => {
      if (item.source !== "server" && item.source !== "network") return true;
      if (!networkUsed) return false;
      return networkState !== "failed" || item.weight > 0;
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
  }, [browserResult, networkIntel, networkUsed, networkState, region, activeSignal, progress, detectorText, locale]);

  const scoreSummary = useMemo(() => summarizeSignals(signals), [signals]);
  const rawScore = scoreSummary.score;
  const coverage = scoreSummary.coverage;
  const fullCoverage = scoreSummary.totalCount > 0 && scoreSummary.evaluatedCount === scoreSummary.totalCount;
  const animatedScore = loading ? Math.round((rawScore * progress) / 100) : rawScore;
  const status = rawScore >= 70 ? "restricted" : rawScore >= 31 ? "possibly_supported" : rawScore > 0 ? "unknown" : fullCoverage ? "supported" : "unknown";
  const pageRegionCode = region !== "auto" ? region : locale === "zh-HK" ? "hk" : locale === "ru" ? "ru" : "cn";
  const networkMatchedRegion = networkUsed && networkIntel ? countryRisk(networkIntel.countryCode, region).matchedRegion : null;
  const detectedRegionCode = (browserResult?.matchedRegion ?? networkMatchedRegion ?? pageRegionCode) as TargetRegion;
  const pageRegion = detectorText.regions[detectedRegionCode];
  const russianSummaryRegions: Record<TargetRegion, string> = { auto: "российской", cn: "китайской", hk: "гонконгской", ru: "российской", ir: "иранской" };
  const suspectedRegion = locale === "ru" ? russianSummaryRegions[detectedRegionCode] : pageRegion;
  const confidenceText = rawScore >= 70 ? detectorText.confidence.high : rawScore >= 31 ? detectorText.confidence.medium : rawScore > 0 ? detectorText.confidence.low : detectorText.confidence.safe;
  const environmentSuffix = locale === "ru" ? "среды" : copy.environmentSuffix;
  const limitationText = !networkUsed ? detectorText.recommendations.limitation : networkState === "ok" ? detectorText.recommendations.limitationNetwork : detectorText.recommendations.limitationNetworkFailed;
  const recommendationList = [
    coverage < 100 ? detectorText.recommendations.incomplete : null,
    rawScore >= 70 ? detectorText.recommendations.high : rawScore >= 31 ? detectorText.recommendations.medium : detectorText.recommendations.low,
    limitationText,
  ].filter((item): item is string => Boolean(item));

  const reportInput = () => ({
    text: detectorText,
    summary: scoreSummary,
    signals,
    score: rawScore,
    statusLabel: detectorText.status[status],
    riskLabel,
    regionLabel: detectorText.regions[region],
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
  const riskLabel = !ringActive ? detectorText.risk.waiting : !hasChecked ? detectorText.risk.checking : animatedScore === 0 ? (fullCoverage ? detectorText.risk.supported : detectorText.risk.unknown) : animatedScore >= 70 ? detectorText.risk.blocked : animatedScore >= 31 ? detectorText.risk.high : detectorText.risk.light;
  const riskLabelClass = !ringActive ? "bg-stone-100 text-stone-500" : !hasChecked ? "bg-blue-50 text-blue-600" : animatedScore === 0 ? "bg-emerald-50 text-emerald-700" : animatedScore >= 70 ? "bg-red-50 text-red-600" : animatedScore >= 31 ? "bg-orange-50 text-orange-700" : "bg-amber-50 text-amber-700";
  const networkNoteTemplate = !networkUsed
    ? detectorText.network.disabled
    : !hasChecked
      ? networkState === "checking" ? detectorText.network.checking : detectorText.network.idle
      : networkState === "ok"
        ? detectorText.network.success
        : networkState === "failed"
          ? detectorText.network.failed
          : detectorText.network.idle;
  const networkNote = networkNoteTemplate.replaceAll("{provider}", networkProvider);

  useEffect(() => {
    if (!showRegionPicker) return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = pickerRef.current;
    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((element) => element.getClientRects().length > 0)
        : [];
    focusables()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setShowRegionPicker(false);
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (openerRef.current?.isConnected) openerRef.current.focus();
    };
  }, [showRegionPicker]);

  useEffect(() => {
    const openPicker = () => {
      if (runningRef.current) return;
      setShowRegionPicker(true);
    };
    window.addEventListener("open-region-picker", openPicker);
    return () => window.removeEventListener("open-region-picker", openPicker);
  }, []);

  useEffect(
    () => () => {
      runTokenRef.current += 1;
      runningRef.current = false;
      window.dispatchEvent(new CustomEvent("checkcc-running", { detail: false }));
    },
    [],
  );

  const runCheck = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    const token = runTokenRef.current + 1;
    runTokenRef.current = token;
    const activeRegion = region;
    setShowRegionPicker(false);
    setLoading(true);
    setBrowserResult(null);
    setNetworkIntel(null);
    setProgress(0);
    setActiveSignal(0);
    window.dispatchEvent(new CustomEvent("checkcc-running", { detail: true }));

    const useNetwork = networkEnabled && ipIntelAvailable;
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
          const [lookup] = await Promise.all([
            lookupNetworkIntel({ endpoint: ipIntelConfig.endpoint, timeoutMs: ipIntelConfig.timeoutMs }),
            progressAnimation,
          ]);
          if (runTokenRef.current !== token) return;
          if (lookup.status === "ok") {
            setNetworkIntel(lookup.intel);
            setNetworkState("ok");
          } else {
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
  };

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
        <button type="button" onClick={() => setShowRegionPicker(true)} disabled={loading} className="h-14 w-full cursor-pointer rounded-full bg-[#d97757] px-8 text-lg font-black text-white shadow-xl shadow-orange-900/20 transition hover:bg-[#c05f3c] disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:min-w-[360px]">
          {loading ? copy.loadingText : copy.idleCta}
        </button>
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
                    <span className="mx-1 text-red-600">{animatedScore}%</span>
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
          </div>
          <div>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-black text-[#0b1220]">{copy.title}</h3>
              <span className="rounded-full bg-[#fffaf3] px-3 py-1 text-xs font-bold text-stone-500">{hasChecked ? copy.signalHitSummary(scoreSummary.hitCount, scoreSummary.totalCount) : copy.signalCount(signals.length, false)}</span>
            </div>
            <div className="mt-2 md:mt-4"><SignalList signals={signals} /></div>
            <p role="status" className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-xs font-semibold leading-5 text-stone-500 ring-1 ring-stone-200">{networkNote}</p>
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

      {showRegionPicker && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/45 p-4" onClick={() => setShowRegionPicker(false)}>
          <div ref={pickerRef} role="dialog" aria-modal="true" aria-labelledby="region-picker-title" aria-describedby="region-picker-desc" className="relative z-[10000] w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 id="region-picker-title" className="text-xl font-black text-[#0b1220]">{copy.targetTitle}</h3>
                <p id="region-picker-desc" className="mt-1 text-sm text-stone-500">{copy.targetDesc}</p>
              </div>
              <button type="button" onClick={() => setShowRegionPicker(false)} aria-label={copy.close} className="grid size-11 place-items-center rounded-full bg-stone-100 text-stone-600 transition hover:bg-stone-200">
                <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div role="group" aria-label={copy.targetTitle} className="mt-5 grid grid-cols-2 gap-3">
              {regions.map((item) => (
                <button key={item.code} type="button" aria-pressed={region === item.code} onClick={() => setRegion(item.code)} className={`rounded-2xl border px-4 py-4 text-center font-black transition ${region === item.code ? "border-[#d97757] bg-orange-50 text-[#c05f3c]" : "border-stone-200 bg-white text-[#0b1220] hover:border-stone-300"}`}>
                  {detectorText.regions[item.code]}
                </button>
              ))}
            </div>
            {ipIntelAvailable && (
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-stone-50 px-4 py-3 ring-1 ring-stone-200">
                <input type="checkbox" checked={networkEnabled} onChange={(event) => setNetworkEnabled(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[#d97757]" />
                <span className="min-w-0 text-left">
                  <span className="block text-sm font-black text-[#0b1220]">{detectorText.network.toggleLabel}</span>
                  <span className="mt-0.5 block text-xs font-semibold leading-5 text-stone-500">{detectorText.network.toggleHint.replaceAll("{provider}", networkProvider)}</span>
                </span>
              </label>
            )}
            <button type="button" onClick={() => { setShowRegionPicker(false); void runCheck(); }} disabled={loading} className="mt-5 h-12 w-full cursor-pointer rounded-full bg-[#d97757] font-black text-white shadow-lg shadow-orange-900/15 disabled:cursor-not-allowed disabled:opacity-60">
              {copy.startCheck}
            </button>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
