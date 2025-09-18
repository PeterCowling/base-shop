import { pricingSchema, type PricingMatrix, type CoverageCode } from "@acme/types";

export type PricingFormStatus = "idle" | "saving" | "saved" | "error";
export type PricingFormTab = "guided" | "json";

export type DurationDraft = {
  id: string;
  minDays: string;
  rate: string;
};

export type DamageDraft = {
  id: string;
  code: string;
  mode: "amount" | "deposit";
  amount: string;
};

export type CoverageDraft = {
  code: CoverageCode;
  enabled: boolean;
  fee: string;
  waiver: string;
};

export type ValidationResult =
  | { success: true; data: PricingMatrix }
  | { success: false; errors: Record<string, string> };

export function validateDurationRows(rows: DurationDraft[]) {
  const durations: PricingMatrix["durationDiscounts"] = [];
  const errors: Record<string, string> = {};

  rows.forEach((row) => {
    const keyBase = `duration-${row.id}`;
    const hasValues = row.minDays.trim() !== "" || row.rate.trim() !== "";
    if (!hasValues) {
      return;
    }

    const minDays = Number(row.minDays);
    const rate = Number(row.rate);

    if (row.minDays.trim() === "" || !Number.isFinite(minDays) || minDays <= 0) {
      errors[`${keyBase}-minDays`] = "Provide minimum rental days";
    }

    if (row.rate.trim() === "" || !Number.isFinite(rate) || rate <= 0) {
      errors[`${keyBase}-rate`] = "Provide a positive multiplier";
    }

    if (!errors[`${keyBase}-minDays`] && !errors[`${keyBase}-rate`]) {
      durations.push({ minDays, rate });
    }
  });

  return { durations, errors };
}

export function validateDamageRows(rows: DamageDraft[]) {
  const damageFees: PricingMatrix["damageFees"] = {};
  const errors: Record<string, string> = {};

  rows.forEach((row) => {
    const keyBase = `damage-${row.id}`;

    if (row.code.trim() === "") {
      errors[`${keyBase}-code`] = "Enter a damage code";
      return;
    }

    if (damageFees[row.code.trim()]) {
      errors[`${keyBase}-code`] = "Damage codes must be unique";
      return;
    }

    if (row.mode === "deposit") {
      damageFees[row.code.trim()] = "deposit";
      return;
    }

    if (row.amount.trim() === "") {
      errors[`${keyBase}-amount`] = "Enter a fee";
      return;
    }

    const parsedAmount = Number(row.amount);
    if (!Number.isFinite(parsedAmount)) {
      errors[`${keyBase}-amount`] = "Fee must be a number";
      return;
    }

    damageFees[row.code.trim()] = parsedAmount;
  });

  return { damageFees, errors };
}

export function validateCoverageRows(rows: CoverageDraft[]) {
  const coverage: PricingMatrix["coverage"] = {};
  const errors: Record<string, string> = {};

  rows.forEach((row) => {
    if (!row.enabled) {
      return;
    }

    const fee = Number(row.fee);
    const waiver = Number(row.waiver);

    if (row.fee.trim() === "" || !Number.isFinite(fee) || fee < 0) {
      errors[`coverage-${row.code}-fee`] = "Enter a non-negative fee";
    }

    if (row.waiver.trim() === "" || !Number.isFinite(waiver) || waiver < 0) {
      errors[`coverage-${row.code}-waiver`] = "Enter a non-negative waiver";
    }

    if (!errors[`coverage-${row.code}-fee`] && !errors[`coverage-${row.code}-waiver`]) {
      coverage[row.code] = { fee, waiver };
    }
  });

  return { coverage, errors };
}

export function buildPricingFromForm({
  baseRate,
  durationRows,
  damageRows,
  coverageRows,
}: {
  baseRate: string;
  durationRows: DurationDraft[];
  damageRows: DamageDraft[];
  coverageRows: CoverageDraft[];
}): ValidationResult {
  const baseInput = baseRate.trim();
  const base = Number(baseInput);
  const errors: Record<string, string> = {};

  if (baseInput === "" || !Number.isFinite(base)) {
    errors.baseDailyRate = "Enter a base daily rate";
  }

  const durationResult = validateDurationRows(durationRows);
  Object.assign(errors, durationResult.errors);

  const damageResult = validateDamageRows(damageRows);
  Object.assign(errors, damageResult.errors);

  const coverageResult = validateCoverageRows(coverageRows);
  Object.assign(errors, coverageResult.errors);

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const candidate: PricingMatrix = {
    baseDailyRate: Number.isFinite(base) ? base : 0,
    durationDiscounts: durationResult.durations,
    damageFees: damageResult.damageFees,
    coverage: coverageResult.coverage,
  };

  const parsed = pricingSchema.safeParse(candidate);
  if (!parsed.success) {
    const aggregate = parsed.error.issues.map((issue) => issue.message).join("; ");
    return { success: false, errors: { root: aggregate } };
  }

  return { success: true, data: parsed.data };
}

export function parseJsonDraft(draft: string): ValidationResult {
  try {
    const json = JSON.parse(draft);
    const parsed = pricingSchema.safeParse(json);

    if (!parsed.success) {
      return {
        success: false,
        errors: {
          json: parsed.error.issues.map((issue) => issue.message).join("; "),
        },
      };
    }

    return { success: true, data: parsed.data };
  } catch (err) {
    return { success: false, errors: { json: (err as Error).message } };
  }
}
