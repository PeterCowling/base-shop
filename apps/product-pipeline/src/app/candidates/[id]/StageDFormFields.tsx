"use client";

import type { Dispatch, SetStateAction } from "react";

import type { StageDFormState } from "./stageDForm";
import type { CandidateDetailStrings, StageDAssetReadiness } from "./types";

export type StageDReadinessOption = {
  value: StageDAssetReadiness;
  label: string;
};

export default function StageDFormFields({
  form,
  setForm,
  disabled,
  strings,
  readinessOptions,
  onEdit,
}: {
  form: StageDFormState;
  setForm: Dispatch<SetStateAction<StageDFormState>>;
  disabled: boolean;
  strings: CandidateDetailStrings["stageD"];
  readinessOptions: StageDReadinessOption[];
  onEdit: () => void;
}) {
  const updateField =
    (key: keyof StageDFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setForm((current) => ({ ...current, [key]: value }));
      onEdit();
    };

  return (
    <>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputAssetReadiness}
        <select
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.assetReadiness}
          onChange={(event) => {
            setForm((current) => ({
              ...current,
              assetReadiness: event.target.value as StageDAssetReadiness,
            }));
            onEdit();
          }}
          disabled={disabled}
        >
          {readinessOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputOneTimeCost}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.oneTimeCost}
          onChange={updateField("oneTimeCost")}
          disabled={disabled}
          type="number"
          min={0}
          step="0.01"
        />
      </label>
      <label className="text-xs uppercase tracking-widest text-foreground/60">
        {strings.inputSamplingRounds}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.samplingRounds}
          onChange={updateField("samplingRounds")}
          disabled={disabled}
          type="number"
          min={0}
          step="1"
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
        {strings.inputPackagingStatus}
        <input
          className="mt-2 w-full rounded-2xl border border-border-1 bg-surface-2 px-3 py-2 text-sm text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          value={form.packagingStatus}
          onChange={updateField("packagingStatus")}
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
