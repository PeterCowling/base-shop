export type StageLabelMap = Record<string, string>;

function normalize(value: string): string {
  return value.trim();
}

export function resolveStageLabel(
  stage: string | null | undefined,
  labels: StageLabelMap,
  fallback: string,
): string {
  if (!stage) return fallback;
  const trimmed = normalize(stage);
  if (!trimmed) return fallback;
  return labels[trimmed] ?? trimmed;
}

export function formatStageStatus(
  stageStatus: string | null | undefined,
  labels: StageLabelMap,
  fallback: string,
): string {
  if (!stageStatus) return fallback;
  const trimmed = normalize(stageStatus);
  if (!trimmed) return fallback;
  const [stage, ...rest] = trimmed.split("_");
  const stageLabel = resolveStageLabel(stage, labels, stage || trimmed);
  if (rest.length === 0) return stageLabel;
  const statusLabel = rest
    .join("_")
    .split("_")
    .filter(Boolean)
    .map((part) => part.toLowerCase())
    .join(" ");
  return statusLabel ? `${stageLabel} (${statusLabel})` : stageLabel;
}

export function formatStageRunLabel(
  run: { stage: string; status: string; createdAt: string | null },
  labels: StageLabelMap,
): string {
  const stageLabel = resolveStageLabel(run.stage, labels, run.stage);
  const stageText = labels[run.stage] ? `${stageLabel} (${run.stage})` : stageLabel;
  const timestamp = run.createdAt ?? "";
  return `${stageText} | ${run.status}${timestamp ? ` | ${timestamp}` : ""}`;
}
