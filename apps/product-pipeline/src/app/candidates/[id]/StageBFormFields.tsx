"use client";

import type { Dispatch, SetStateAction } from "react";
import type { CandidateDetailStrings } from "./types";
import type { StageBFormState } from "./stageBForm";

export default function StageBFormFields({
  form,
  setForm,
  disabled,
  strings,
  onEdit,
}: {
  form: StageBFormState;
  setForm: Dispatch<SetStateAction<StageBFormState>>;
  disabled: boolean;
  strings: CandidateDetailStrings["stageB"];
  onEdit: () => void;
}) {
  const updateField =
    (key: keyof StageBFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setForm((current) => ({ ...current, [key]: value }));
      onEdit();
    };

  return (
    <>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputUnitsPlanned}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.unitsPlanned}
          onChange={updateField("unitsPlanned")}
          disabled={disabled}
          type="number"
          min={1}
          step="1"
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
        {strings.inputFreight}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.freight}
          onChange={updateField("freight")}
          disabled={disabled}
          type="number"
          min={0}
          step="0.01"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputDuty}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.duty}
          onChange={updateField("duty")}
          disabled={disabled}
          type="number"
          min={0}
          step="0.01"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputVat}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.vat}
          onChange={updateField("vat")}
          disabled={disabled}
          type="number"
          min={0}
          step="0.01"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputPackaging}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.packaging}
          onChange={updateField("packaging")}
          disabled={disabled}
          type="number"
          min={0}
          step="0.01"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputInspection}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.inspection}
          onChange={updateField("inspection")}
          disabled={disabled}
          type="number"
          min={0}
          step="0.01"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputOther}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.other}
          onChange={updateField("other")}
          disabled={disabled}
          type="number"
          min={0}
          step="0.01"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputLeadTime}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.leadTimeDays}
          onChange={updateField("leadTimeDays")}
          disabled={disabled}
          type="number"
          min={0}
          step="1"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputDepositPct}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.depositPct}
          onChange={updateField("depositPct")}
          disabled={disabled}
          type="number"
          min={0}
          max={100}
          step="1"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputBalanceDueDays}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.balanceDueDays}
          onChange={updateField("balanceDueDays")}
          disabled={disabled}
          type="number"
          min={0}
          step="1"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputIncoterms}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.incoterms}
          onChange={updateField("incoterms")}
          disabled={disabled}
          type="text"
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
