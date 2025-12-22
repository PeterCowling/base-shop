"use client";

import type { StageBInput } from "./stageBHelpers";

export type StageBFormState = {
  unitsPlanned: string;
  unitCost: string;
  freight: string;
  duty: string;
  vat: string;
  packaging: string;
  inspection: string;
  other: string;
  leadTimeDays: string;
  depositPct: string;
  balanceDueDays: string;
  incoterms: string;
  notes: string;
};

export const DEFAULT_STAGE_B_FORM: StageBFormState = {
  unitsPlanned: "500",
  unitCost: "5.5",
  freight: "1.2",
  duty: "0.3",
  vat: "0.8",
  packaging: "0.25",
  inspection: "0.1",
  other: "",
  leadTimeDays: "45",
  depositPct: "30",
  balanceDueDays: "0",
  incoterms: "FOB",
  notes: "",
};

function parseCurrencyRequired(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

function parseCurrencyOptional(value: string): number | undefined | null {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

function parseIntRequired(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseIntOptional(value: string): number | undefined | null {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

function parsePercentOptional(value: string): number | undefined | null {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return null;
  return parsed;
}

export function hydrateStageBForm(input: StageBInput | null): StageBFormState {
  if (!input) return DEFAULT_STAGE_B_FORM;
  return {
    unitsPlanned:
      input.unitsPlanned !== undefined ? String(input.unitsPlanned) : "500",
    unitCost:
      input.unitCostCents !== undefined
        ? String(input.unitCostCents / 100)
        : "5.5",
    freight:
      input.freightCents !== undefined
        ? String(input.freightCents / 100)
        : "1.2",
    duty:
      input.dutyCents !== undefined
        ? String(input.dutyCents / 100)
        : "0.3",
    vat:
      input.vatCents !== undefined ? String(input.vatCents / 100) : "0.8",
    packaging:
      input.packagingCents !== undefined
        ? String(input.packagingCents / 100)
        : "0.25",
    inspection:
      input.inspectionCents !== undefined
        ? String(input.inspectionCents / 100)
        : "0.1",
    other:
      input.otherCents !== undefined ? String(input.otherCents / 100) : "",
    leadTimeDays:
      input.leadTimeDays !== undefined
        ? String(input.leadTimeDays)
        : "45",
    depositPct:
      input.depositPct !== undefined ? String(input.depositPct) : "30",
    balanceDueDays:
      input.balanceDueDays !== undefined
        ? String(input.balanceDueDays)
        : "0",
    incoterms: input.incoterms ?? "FOB",
    notes: input.notes ?? "",
  };
}

export function parseStageBForm(form: StageBFormState): {
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
} | null {
  const unitsPlanned = parseIntRequired(form.unitsPlanned);
  const unitCostCents = parseCurrencyRequired(form.unitCost);
  if (unitsPlanned === null || unitCostCents === null) return null;

  const freightCents = parseCurrencyOptional(form.freight);
  const dutyCents = parseCurrencyOptional(form.duty);
  const vatCents = parseCurrencyOptional(form.vat);
  const packagingCents = parseCurrencyOptional(form.packaging);
  const inspectionCents = parseCurrencyOptional(form.inspection);
  const otherCents = parseCurrencyOptional(form.other);
  const leadTimeDays = parseIntOptional(form.leadTimeDays);
  const balanceDueDays = parseIntOptional(form.balanceDueDays);
  const depositPct = parsePercentOptional(form.depositPct);

  if (
    freightCents === null ||
    dutyCents === null ||
    vatCents === null ||
    packagingCents === null ||
    inspectionCents === null ||
    otherCents === null ||
    leadTimeDays === null ||
    balanceDueDays === null ||
    depositPct === null
  ) {
    return null;
  }

  return {
    unitsPlanned,
    unitCostCents,
    ...(freightCents !== undefined ? { freightCents } : {}),
    ...(dutyCents !== undefined ? { dutyCents } : {}),
    ...(vatCents !== undefined ? { vatCents } : {}),
    ...(packagingCents !== undefined ? { packagingCents } : {}),
    ...(inspectionCents !== undefined ? { inspectionCents } : {}),
    ...(otherCents !== undefined ? { otherCents } : {}),
    ...(leadTimeDays !== undefined ? { leadTimeDays } : {}),
    ...(depositPct !== undefined ? { depositPct } : {}),
    ...(balanceDueDays !== undefined ? { balanceDueDays } : {}),
  };
}
