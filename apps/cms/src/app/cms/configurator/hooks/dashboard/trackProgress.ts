import type { TrackProgressItem } from "./types";
import type { ConfiguratorStep } from "../../types";
import { stepTrackMeta } from "../../steps";

export function buildTrackProgress(
  steps: ConfiguratorStep[],
  completed: Record<string, string> | undefined,
): TrackProgressItem[] {
  const meta = stepTrackMeta;
  if (!meta) return [];

  return Object.entries(meta)
    .map(([track, metaValue]) => {
      const scopedSteps = steps.filter((step) => step.track === track);
      if (scopedSteps.length === 0) return null;
      const done = scopedSteps.filter((step) => completed?.[step.id] === "complete").length;
      const percent = Math.round((done / scopedSteps.length) * 100);
      return {
        key: track,
        label: metaValue.label,
        description: metaValue.description,
        done,
        total: scopedSteps.length,
        percent,
      } as TrackProgressItem;
    })
    .filter((v): v is TrackProgressItem => v !== null);
}
