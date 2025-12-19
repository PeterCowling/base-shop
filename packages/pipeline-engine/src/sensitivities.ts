import type {
  SensitivityDefinition,
  StageKInput,
  StageKResult,
  StageKSensitivities,
} from "./types";
import { computeStageK } from "./stage-k";

const defaultMetric = (result: StageKResult) =>
  result.annualizedCapitalReturnRate;

export function computeSensitivities({
  baseInput,
  definitions,
  metric = defaultMetric,
}: {
  baseInput: StageKInput;
  definitions: SensitivityDefinition[];
  metric?: (result: StageKResult) => number | null;
}): StageKSensitivities {
  const baseResult = computeStageK(baseInput);
  const baseMetric = metric(baseResult);

  const output: StageKSensitivities = {};

  for (const definition of definitions) {
    if (!definition.delta || baseMetric === null) {
      output[definition.label] = null;
      continue;
    }

    const nextInput = definition.apply(baseInput, definition.delta);
    const nextResult = computeStageK(nextInput);
    const nextMetric = metric(nextResult);

    if (nextMetric === null) {
      output[definition.label] = null;
      continue;
    }

    output[definition.label] = (nextMetric - baseMetric) / definition.delta;
  }

  return output;
}
