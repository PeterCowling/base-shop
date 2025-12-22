"use client";

import type { Dispatch, SetStateAction } from "react";
import type { CandidateDetailStrings } from "./types";
import type { StageCFormState } from "./stageCForm";

export default function StageCFormFields({
  form,
  setForm,
  disabled,
  strings,
  onEdit,
}: {
  form: StageCFormState;
  setForm: Dispatch<SetStateAction<StageCFormState>>;
  disabled: boolean;
  strings: CandidateDetailStrings["stageC"];
  onEdit: () => void;
}) {
  const updateField =
    (key: keyof StageCFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setForm((current) => ({ ...current, [key]: value }));
      onEdit();
    };

  return (
    <>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputSalePrice}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.salePrice}
          onChange={updateField("salePrice")}
          disabled={disabled}
          type="number"
          min={0}
          step="0.01"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputPlatformFeePct}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.platformFeePct}
          onChange={updateField("platformFeePct")}
          disabled={disabled}
          type="number"
          min={0}
          max={100}
          step="0.1"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputFulfillment}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.fulfillment}
          onChange={updateField("fulfillment")}
          disabled={disabled}
          type="number"
          min={0}
          step="0.01"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputStorage}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.storage}
          onChange={updateField("storage")}
          disabled={disabled}
          type="number"
          min={0}
          step="0.01"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputAdvertising}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.advertising}
          onChange={updateField("advertising")}
          disabled={disabled}
          type="number"
          min={0}
          step="0.01"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputOtherFees}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.otherFees}
          onChange={updateField("otherFees")}
          disabled={disabled}
          type="number"
          min={0}
          step="0.01"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputReturnRatePct}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.returnRatePct}
          onChange={updateField("returnRatePct")}
          disabled={disabled}
          type="number"
          min={0}
          max={100}
          step="0.1"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputPayoutDelay}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.payoutDelayDays}
          onChange={updateField("payoutDelayDays")}
          disabled={disabled}
          type="number"
          min={0}
          step="1"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputUnitsPlanned}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.unitsPlanned}
          onChange={updateField("unitsPlanned")}
          disabled={disabled}
          type="number"
          min={0}
          step="1"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
        {strings.inputNotes}
        <textarea
          className="mt-2 min-h-24 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.notes}
          onChange={updateField("notes")}
          disabled={disabled}
        />
      </label>
    </>
  );
}
