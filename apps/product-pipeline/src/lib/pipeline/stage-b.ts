/* i18n-exempt file -- PP-1100 internal pipeline helper [ttl=2026-06-30] */
// apps/product-pipeline/src/lib/pipeline/stage-b.ts

export type StageBInput = {
  unitsPlanned: number;
  unitCostCents: number;
  freightCents?: number;
  dutyCents?: number;
  vatCents?: number;
  packagingCents?: number;
  inspectionCents?: number;
  otherCents?: number;
  leadTimeDays?: number;
  depositPct?: number;
  balanceDueDays?: number;
  incoterms?: string;
  notes?: string | null;
  lane?: unknown;
};

export type StageBOutputSummary = {
  perUnitLandedCostCents: string;
  totalLandedCostCents: string;
  depositPct: number | null;
  depositAmountCents: string | null;
  balanceAmountCents: string | null;
  leadTimeDays: number | null;
  balanceDueDays: number | null;
  balanceDueDay: number | null;
};

export type StageBOutput = {
  engineVersion: string;
  summary: StageBOutputSummary;
  breakdown: {
    unitCostCents: string;
    freightCents: string;
    dutyCents: string;
    vatCents: string;
    packagingCents: string;
    inspectionCents: string;
    otherCents: string;
  };
  notes: string | null;
};

export const STAGE_B_ENGINE_VERSION = "stage-b:v1";

function optionalCents(value: number | undefined): number {
  return value ?? 0;
}

function toString(value: number | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

export function computeStageBOutput(input: StageBInput): StageBOutput {
  const perUnitLandedCostCents =
    input.unitCostCents +
    optionalCents(input.freightCents) +
    optionalCents(input.dutyCents) +
    optionalCents(input.vatCents) +
    optionalCents(input.packagingCents) +
    optionalCents(input.inspectionCents) +
    optionalCents(input.otherCents);
  const totalLandedCostCents = perUnitLandedCostCents * input.unitsPlanned;
  const depositPctValue = input.depositPct ?? null;
  const depositAmountCents =
    depositPctValue === null
      ? null
      : Math.round((totalLandedCostCents * depositPctValue) / 100);
  const balanceAmountCents =
    depositAmountCents === null
      ? null
      : totalLandedCostCents - depositAmountCents;
  const balanceDueDay =
    input.leadTimeDays !== undefined && input.leadTimeDays !== null
      ? input.leadTimeDays + (input.balanceDueDays ?? 0)
      : null;

  const summary: StageBOutputSummary = {
    perUnitLandedCostCents: String(perUnitLandedCostCents),
    totalLandedCostCents: String(totalLandedCostCents),
    depositPct: depositPctValue,
    depositAmountCents: toString(depositAmountCents),
    balanceAmountCents: toString(balanceAmountCents),
    leadTimeDays: input.leadTimeDays ?? null,
    balanceDueDays: input.balanceDueDays ?? null,
    balanceDueDay,
  };

  return {
    engineVersion: STAGE_B_ENGINE_VERSION,
    summary,
    breakdown: {
      unitCostCents: String(input.unitCostCents),
      freightCents: String(optionalCents(input.freightCents)),
      dutyCents: String(optionalCents(input.dutyCents)),
      vatCents: String(optionalCents(input.vatCents)),
      packagingCents: String(optionalCents(input.packagingCents)),
      inspectionCents: String(optionalCents(input.inspectionCents)),
      otherCents: String(optionalCents(input.otherCents)),
    },
    notes: input.notes ?? null,
  };
}
