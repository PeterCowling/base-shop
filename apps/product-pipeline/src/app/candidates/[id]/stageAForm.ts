"use client";

import type { StageAInput } from "./stageAHelpers";

export type StageAFormState = {
  salePrice: string;
  unitCost: string;
  shipping: string;
  feesPct: string;
  targetMarginPct: string;
  notes: string;
};

export const DEFAULT_STAGE_A_FORM: StageAFormState = {
  salePrice: "24.99",
  unitCost: "8.5",
  shipping: "2.0",
  feesPct: "15",
  targetMarginPct: "25",
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

function parsePercentOptional(value: string): number | undefined | null {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return null;
  return parsed;
}

export function hydrateStageAForm(input: StageAInput | null): StageAFormState {
  if (!input) return DEFAULT_STAGE_A_FORM;
  return {
    salePrice:
      input.salePriceCents !== undefined
        ? String(input.salePriceCents / 100)
        : "24.99",
    unitCost:
      input.unitCostCents !== undefined
        ? String(input.unitCostCents / 100)
        : "8.5",
    shipping:
      input.shippingCents !== undefined
        ? String(input.shippingCents / 100)
        : "2.0",
    feesPct:
      input.feesPct !== undefined ? String(input.feesPct) : "15",
    targetMarginPct:
      input.targetMarginPct !== undefined
        ? String(input.targetMarginPct)
        : "25",
    notes: input.notes ?? "",
  };
}

export function parseStageAForm(form: StageAFormState): {
  salePriceCents: number;
  unitCostCents: number;
  shippingCents?: number;
  feesPct?: number;
  targetMarginPct?: number;
} | null {
  const salePriceCents = parseCurrencyRequired(form.salePrice);
  const unitCostCents = parseCurrencyRequired(form.unitCost);
  if (salePriceCents === null || unitCostCents === null) return null;

  const shippingCents = parseCurrencyOptional(form.shipping);
  const feesPct = parsePercentOptional(form.feesPct);
  const targetMarginPct = parsePercentOptional(form.targetMarginPct);

  if (shippingCents === null || feesPct === null || targetMarginPct === null) {
    return null;
  }

  return {
    salePriceCents,
    unitCostCents,
    ...(shippingCents !== undefined ? { shippingCents } : {}),
    ...(feesPct !== undefined ? { feesPct } : {}),
    ...(targetMarginPct !== undefined ? { targetMarginPct } : {}),
  };
}
