"use client";

import type { StageCInput } from "./stageCHelpers";

export type StageCFormState = {
  salePrice: string;
  platformFeePct: string;
  fulfillment: string;
  storage: string;
  advertising: string;
  otherFees: string;
  returnRatePct: string;
  payoutDelayDays: string;
  unitsPlanned: string;
  notes: string;
};

export const DEFAULT_STAGE_C_FORM: StageCFormState = {
  salePrice: "24.9",
  platformFeePct: "15",
  fulfillment: "3.2",
  storage: "0.3",
  advertising: "1.1",
  otherFees: "",
  returnRatePct: "4",
  payoutDelayDays: "14",
  unitsPlanned: "500",
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

function parsePercentRequired(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return null;
  return parsed;
}

function parsePercentOptional(value: string): number | undefined | null {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return null;
  return parsed;
}

function parseIntOptional(value: string): number | undefined | null {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function hydrateStageCForm(input: StageCInput | null): StageCFormState {
  if (!input) return DEFAULT_STAGE_C_FORM;
  return {
    salePrice:
      input.salePriceCents !== undefined
        ? String(input.salePriceCents / 100)
        : "24.9",
    platformFeePct:
      input.platformFeePct !== undefined ? String(input.platformFeePct) : "15",
    fulfillment:
      input.fulfillmentFeeCents !== undefined
        ? String(input.fulfillmentFeeCents / 100)
        : "3.2",
    storage:
      input.storageFeeCents !== undefined
        ? String(input.storageFeeCents / 100)
        : "0.3",
    advertising:
      input.advertisingCents !== undefined
        ? String(input.advertisingCents / 100)
        : "1.1",
    otherFees:
      input.otherFeesCents !== undefined
        ? String(input.otherFeesCents / 100)
        : "",
    returnRatePct:
      input.returnRatePct !== undefined ? String(input.returnRatePct) : "4",
    payoutDelayDays:
      input.payoutDelayDays !== undefined
        ? String(input.payoutDelayDays)
        : "14",
    unitsPlanned:
      input.unitsPlanned !== undefined ? String(input.unitsPlanned) : "500",
    notes: input.notes ?? "",
  };
}

export function parseStageCForm(form: StageCFormState): {
  salePriceCents: number;
  platformFeePct: number;
  fulfillmentFeeCents?: number;
  storageFeeCents?: number;
  advertisingCents?: number;
  otherFeesCents?: number;
  returnRatePct?: number;
  payoutDelayDays?: number;
  unitsPlanned?: number;
} | null {
  const salePriceCents = parseCurrencyRequired(form.salePrice);
  const platformFeePct = parsePercentRequired(form.platformFeePct);
  if (salePriceCents === null || platformFeePct === null) return null;

  const fulfillmentFeeCents = parseCurrencyOptional(form.fulfillment);
  const storageFeeCents = parseCurrencyOptional(form.storage);
  const advertisingCents = parseCurrencyOptional(form.advertising);
  const otherFeesCents = parseCurrencyOptional(form.otherFees);
  const returnRatePct = parsePercentOptional(form.returnRatePct);
  const payoutDelayDays = parseIntOptional(form.payoutDelayDays);
  const unitsPlanned = parseIntOptional(form.unitsPlanned);

  if (
    fulfillmentFeeCents === null ||
    storageFeeCents === null ||
    advertisingCents === null ||
    otherFeesCents === null ||
    returnRatePct === null ||
    payoutDelayDays === null ||
    unitsPlanned === null
  ) {
    return null;
  }

  return {
    salePriceCents,
    platformFeePct,
    ...(fulfillmentFeeCents !== undefined ? { fulfillmentFeeCents } : {}),
    ...(storageFeeCents !== undefined ? { storageFeeCents } : {}),
    ...(advertisingCents !== undefined ? { advertisingCents } : {}),
    ...(otherFeesCents !== undefined ? { otherFeesCents } : {}),
    ...(returnRatePct !== undefined ? { returnRatePct } : {}),
    ...(payoutDelayDays !== undefined ? { payoutDelayDays } : {}),
    ...(unitsPlanned !== undefined ? { unitsPlanned } : {}),
  };
}
