import type { SignalScoreSummary, SignalView } from "./client-engine";
import type { DetectorLocaleText } from "./locale";

export type DetectionReportInput = {
  text: DetectorLocaleText;
  summary: SignalScoreSummary;
  signals: SignalView[];
  score: number;
  statusLabel: string;
  riskLabel: string;
  // 检测出的地区画像；没有风险命中时为用户选择的目标。
  regionLabel: string;
  targetLabel?: string;
  recommendations: string[];
  limitation?: string;
  generatedAt?: Date;
};

function reportDate(input: DetectionReportInput) {
  return (input.generatedAt ?? new Date()).toISOString();
}

function limitationNote(input: DetectionReportInput) {
  return input.limitation ?? input.text.recommendations.limitation;
}

function signalValue(signal: SignalView, text: DetectorLocaleText) {
  if (signal.state === "pending" || signal.state === "running" || signal.state === "unavailable") return text.notEvaluated;
  return signal.value || text.notEvaluated;
}

function signalLine(signal: SignalView, text: DetectorLocaleText) {
  const value = signalValue(signal, text);
  if (signal.weight <= 0) return `- ${signal.label}: ${value} (${text.report.context})`;
  const contribution = signal.state === "done" && signal.evaluated !== false ? `+${signal.contribution}` : "--";
  return `- ${signal.label}: ${value} (${text.report.weight} ${signal.weight}, ${text.report.contribution} ${contribution})`;
}

export function buildTextReport(input: DetectionReportInput) {
  const { text, summary } = input;
  const coverage = `${summary.coverage}% (${summary.evaluatedCount}/${summary.totalCount})`;
  const hitCount = `${summary.hitCount} / ${summary.totalCount}`;
  return [
    `CheckCC · ${text.report.title}`,
    `${text.report.generatedAt}: ${reportDate(input)}`,
    `${text.report.riskScore}: ${input.score} / 100`,
    `${text.report.coverage}: ${coverage}`,
    `${text.report.hitCount}: ${hitCount}`,
    `${text.report.status}: ${input.statusLabel} · ${input.riskLabel}`,
    `${text.report.region}: ${input.regionLabel}`,
    ...(input.targetLabel && input.targetLabel !== input.regionLabel ? [`${text.report.target}: ${input.targetLabel}`] : []),
    "",
    text.report.signals,
    ...input.signals.map((signal) => signalLine(signal, text)),
    "",
    text.report.recommendations,
    ...input.recommendations.map((item, index) => `${index + 1}. ${item}`),
  ].join("\n");
}

export function buildJsonReport(input: DetectionReportInput) {
  const { summary } = input;
  return JSON.stringify(
    {
      tool: "CheckCC",
      generatedAt: reportDate(input),
      score: input.score,
      status: input.statusLabel,
      risk: input.riskLabel,
      region: input.regionLabel,
      target: input.targetLabel ?? input.regionLabel,
      coverage: {
        percent: summary.coverage,
        evaluated: summary.evaluatedCount,
        total: summary.totalCount,
      },
      hitCount: summary.hitCount,
      signals: input.signals.map((signal) => ({
        id: signal.id,
        label: signal.label,
        value: signal.value,
        weight: signal.weight,
        contribution: signal.contribution,
        source: signal.source,
        state: signal.state ?? null,
        evaluated: signal.evaluated !== false,
      })),
      recommendations: input.recommendations,
      limitation: limitationNote(input),
    },
    null,
    2,
  );
}

export function reportFilename(generatedAt: Date = new Date()) {
  return `checkcc-report-${generatedAt.toISOString().slice(0, 10)}.json`;
}
