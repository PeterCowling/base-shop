"use client";

import type { Dispatch, SetStateAction } from "react";
import type { CandidateDetailStrings } from "./types";
import type { StageAFormState } from "./stageAForm";

export default function StageAFormFields({
  form,
  setForm,
  disabled,
  strings,
  onEdit,
}: {
  form: StageAFormState;
  setForm: Dispatch<SetStateAction<StageAFormState>>;
  disabled: boolean;
  strings: CandidateDetailStrings["stageA"];
  onEdit: () => void;
}) {
  const updateField =
    (key: keyof StageAFormState) =>
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
        {strings.inputUnitCost}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.unitCost}
          onChange={updateField("unitCost")}
          disabled={disabled}
          type="number"
          min={0}
          step="0.01"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputShipping}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.shipping}
          onChange={updateField("shipping")}
          disabled={disabled}
          type="number"
          min={0}
          step="0.01"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputFeesPct}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.feesPct}
          onChange={updateField("feesPct")}
          disabled={disabled}
          type="number"
          min={0}
          max={100}
          step="0.1"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputTargetMarginPct}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.targetMarginPct}
          onChange={updateField("targetMarginPct")}
          disabled={disabled}
          type="number"
          min={0}
          max={100}
          step="0.1"
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
