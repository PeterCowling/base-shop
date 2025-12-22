"use client";

import type { StageNInput } from "./stageNHelpers";
import type { StageNNegotiationStatus } from "./types";

export type StageNFormState = {
  status: StageNNegotiationStatus;
  supplierName: string;
  targetUnitCost: string;
  targetMoq: string;
  targetLeadTimeDays: string;
  targetDepositPct: string;
  targetPaymentTerms: string;
  targetIncoterms: string;
  tasks: string;
  notes: string;
};

export const DEFAULT_STAGE_N_FORM: StageNFormState = {
  status: "not_started",
  supplierName: "",
  targetUnitCost: "",
  targetMoq: "",
  targetLeadTimeDays: "",
  targetDepositPct: "",
  targetPaymentTerms: "",
  targetIncoterms: "",
  tasks: "",
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

function parsePercentOptional(value: string): number | undefined | null {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) return null;
  return parsed;
}

export function hydrateStageNForm(input: StageNInput | null): StageNFormState {
  if (!input) return DEFAULT_STAGE_N_FORM;
  return {
    status: input.status ?? "not_started",
    supplierName: input.supplierName ?? "",
    targetUnitCost:
      input.targetUnitCostCents !== undefined
        ? String(input.targetUnitCostCents / 100)
        : "",
    targetMoq:
      input.targetMoq !== undefined ? String(input.targetMoq) : "",
    targetLeadTimeDays:
      input.targetLeadTimeDays !== undefined
        ? String(input.targetLeadTimeDays)
        : "",
    targetDepositPct:
      input.targetDepositPct !== undefined
        ? String(input.targetDepositPct)
        : "",
    targetPaymentTerms: input.targetPaymentTerms ?? "",
    targetIncoterms: input.targetIncoterms ?? "",
    tasks: input.tasks ? input.tasks.join(", ") : "",
    notes: input.notes ?? "",
  };
}

export function parseStageNForm(form: StageNFormState): {
  status: StageNNegotiationStatus;
  supplierName?: string;
  targetUnitCostCents?: number;
  targetMoq?: number;
  targetLeadTimeDays?: number;
  targetDepositPct?: number;
  targetPaymentTerms?: string;
  targetIncoterms?: string;
} | null {
  const targetUnitCostCents = parseCurrencyOptional(form.targetUnitCost);
  const targetMoq = parseIntOptional(form.targetMoq);
  const targetLeadTimeDays = parseIntOptional(form.targetLeadTimeDays);
  const targetDepositPct = parsePercentOptional(form.targetDepositPct);

  if (
    targetUnitCostCents === null ||
    targetMoq === null ||
    targetLeadTimeDays === null ||
    targetDepositPct === null
  ) {
    return null;
  }

  const supplierName = form.supplierName.trim();
  const targetPaymentTerms = form.targetPaymentTerms.trim();
  const targetIncoterms = form.targetIncoterms.trim();

  return {
    status: form.status,
    ...(supplierName ? { supplierName } : {}),
    ...(targetUnitCostCents !== undefined ? { targetUnitCostCents } : {}),
    ...(targetMoq !== undefined ? { targetMoq } : {}),
    ...(targetLeadTimeDays !== undefined ? { targetLeadTimeDays } : {}),
    ...(targetDepositPct !== undefined ? { targetDepositPct } : {}),
    ...(targetPaymentTerms ? { targetPaymentTerms } : {}),
    ...(targetIncoterms ? { targetIncoterms } : {}),
  };
}
