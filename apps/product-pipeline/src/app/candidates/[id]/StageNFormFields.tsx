"use client";

import type { Dispatch, SetStateAction } from "react";

import type { StageNFormState } from "./stageNForm";
import type { CandidateDetailStrings, StageNNegotiationStatus } from "./types";

export type StageNStatusOption = {
  value: StageNNegotiationStatus;
  label: string;
};

export default function StageNFormFields({
  form,
  setForm,
  disabled,
  strings,
  statusOptions,
  onEdit,
}: {
  form: StageNFormState;
  setForm: Dispatch<SetStateAction<StageNFormState>>;
  disabled: boolean;
  strings: CandidateDetailStrings["stageN"];
  statusOptions: StageNStatusOption[];
  onEdit: () => void;
}) {
  const updateField =
    (key: keyof StageNFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setForm((current) => ({ ...current, [key]: value }));
      onEdit();
    };

  return (
    <>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputStatus}
        <select
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.status}
          onChange={(event) => {
            setForm((current) => ({
              ...current,
              status: event.target.value as StageNNegotiationStatus,
            }));
            onEdit();
          }}
          disabled={disabled}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputSupplier}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.supplierName}
          onChange={updateField("supplierName")}
          disabled={disabled}
          type="text"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputTargetUnitCost}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.targetUnitCost}
          onChange={updateField("targetUnitCost")}
          disabled={disabled}
          type="number"
          min={0}
          step="0.01"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputTargetMoq}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.targetMoq}
          onChange={updateField("targetMoq")}
          disabled={disabled}
          type="number"
          min={0}
          step="1"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputTargetLeadTime}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.targetLeadTimeDays}
          onChange={updateField("targetLeadTimeDays")}
          disabled={disabled}
          type="number"
          min={0}
          step="1"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputTargetDepositPct}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.targetDepositPct}
          onChange={updateField("targetDepositPct")}
          disabled={disabled}
          type="number"
          min={0}
          max={100}
          step="1"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputTargetPaymentTerms}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.targetPaymentTerms}
          onChange={updateField("targetPaymentTerms")}
          disabled={disabled}
          type="text"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputTargetIncoterms}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.targetIncoterms}
          onChange={updateField("targetIncoterms")}
          disabled={disabled}
          type="text"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60 md:col-span-2">
        {strings.inputTasks}
        <textarea
          className="mt-2 min-h-24 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.tasks}
          onChange={updateField("tasks")}
          disabled={disabled}
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
