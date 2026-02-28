export interface CritiqueCountsInput {
  critical: number;
  major: number;
  minor: number;
  round: number;
}

export interface CritiqueGateResult {
  rewrite: boolean;
  nextRound: boolean;
  reason: string;
}

export interface ScoreMovementInput {
  prior?: number | null;
  current: number;
  hasDeltaJustification: boolean;
}

export interface ScoreMovementResult {
  valid: boolean;
  violation?: string;
  delta: number;
}

export function shouldTriggerSectionRewrite(input: CritiqueCountsInput): boolean {
  const total = input.critical + input.major + input.minor;
  return input.critical > 0 || input.major >= 2 || total >= 4;
}

export function shouldRunNextRound(input: CritiqueCountsInput): boolean {
  if (input.round >= 3) {
    return false;
  }
  if (input.round === 1) {
    return input.critical > 0 || input.major >= 2;
  }
  if (input.round === 2) {
    return input.critical > 0;
  }
  return false;
}

export function evaluateCritiqueGate(input: CritiqueCountsInput): CritiqueGateResult {
  const rewrite = shouldTriggerSectionRewrite(input);
  const nextRound = shouldRunNextRound(input);
  const reasons: string[] = [];
  if (input.critical > 0) {
    reasons.push("Critical findings present.");
  }
  if (input.major >= 2) {
    reasons.push("Major findings threshold reached.");
  }
  if (input.critical + input.major + input.minor >= 4) {
    reasons.push("Total findings threshold reached.");
  }
  if (input.round >= 3) {
    reasons.push("Round 3 is terminal.");
  }
  if (reasons.length === 0) {
    reasons.push("No critique escalation threshold reached.");
  }

  return {
    rewrite,
    nextRound,
    reason: reasons.join(" "),
  };
}

export function validateScoreMovement(input: ScoreMovementInput): ScoreMovementResult {
  if (input.prior === null || input.prior === undefined) {
    return { valid: true, delta: 0 };
  }
  const delta = Math.abs(input.current - input.prior);
  if (delta <= 0.5 || input.hasDeltaJustification) {
    return { valid: true, delta };
  }
  return {
    valid: false,
    delta,
    violation:
      "Score delta exceeds 0.5 without explicit new-evidence justification.",
  };
}
