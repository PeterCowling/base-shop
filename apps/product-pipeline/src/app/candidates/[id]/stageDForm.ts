"use client";

import type { StageDInput } from "./stageDHelpers";
import type { StageDAssetReadiness } from "./types";

export type StageDFormState = {
  assetReadiness: StageDAssetReadiness;
  oneTimeCost: string;
  samplingRounds: string;
  leadTimeDays: string;
  packagingStatus: string;
  notes: string;
};

export const DEFAULT_STAGE_D_FORM: StageDFormState = {
  assetReadiness: "not_started",
  oneTimeCost: "",
  samplingRounds: "",
  leadTimeDays: "",
  packagingStatus: "",
  notes: "",
};

function parseCurrencyOptional(value: string): number | undefined | null {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

function parseIntOptional(value: string): number | undefined | null {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export function hydrateStageDForm(input: StageDInput | null): StageDFormState {
  if (!input) return DEFAULT_STAGE_D_FORM;
  return {
    assetReadiness: input.assetReadiness ?? "not_started",
    oneTimeCost:
      input.oneTimeCostCents !== undefined
        ? String(input.oneTimeCostCents / 100)
        : "",
    samplingRounds:
      input.samplingRounds !== undefined
        ? String(input.samplingRounds)
        : "",
    leadTimeDays:
      input.leadTimeDays !== undefined ? String(input.leadTimeDays) : "",
    packagingStatus: input.packagingStatus ?? "",
    notes: input.notes ?? "",
  };
}

export function parseStageDForm(form: StageDFormState): {
  assetReadiness: StageDAssetReadiness;
  oneTimeCostCents?: number;
  samplingRounds?: number;
  leadTimeDays?: number;
  packagingStatus?: string;
} | null {
  const oneTimeCostCents = parseCurrencyOptional(form.oneTimeCost);
  const samplingRounds = parseIntOptional(form.samplingRounds);
  const leadTimeDays = parseIntOptional(form.leadTimeDays);

  if (oneTimeCostCents === null || samplingRounds === null || leadTimeDays === null) {
    return null;
  }

  const packagingStatus = form.packagingStatus.trim();

  return {
    assetReadiness: form.assetReadiness,
    ...(oneTimeCostCents !== undefined ? { oneTimeCostCents } : {}),
    ...(samplingRounds !== undefined ? { samplingRounds } : {}),
    ...(leadTimeDays !== undefined ? { leadTimeDays } : {}),
    ...(packagingStatus ? { packagingStatus } : {}),
  };
}
