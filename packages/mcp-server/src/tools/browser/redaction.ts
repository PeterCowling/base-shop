import type { BicAffordance, BicObservation } from "./bic.js";

export function redactAffordanceValue(affordance: BicAffordance): BicAffordance {
  if (!affordance.sensitive) {
    return affordance;
  }

  const { value: _ignored, ...rest } = affordance;

  return {
    ...rest,
    valueRedacted: true,
  };
}

export function redactBicValues(observation: BicObservation): BicObservation {
  return {
    ...observation,
    affordances: observation.affordances.map((affordance) => redactAffordanceValue(affordance)),
  };
}

