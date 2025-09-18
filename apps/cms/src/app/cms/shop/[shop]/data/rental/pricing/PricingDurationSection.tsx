import { Button, Input } from "@/components/atoms/shadcn";
import { type ChangeEvent } from "react";

import { type DurationDraft } from "./usePricingFormState";

interface Props {
  rows: DurationDraft[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<DurationDraft, "id">>) => void;
  getErrors: (id: string) => { minDays?: string; rate?: string };
}

export default function PricingDurationSection({ rows, onAdd, onRemove, onUpdate, getErrors }: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">Duration discounts</h3>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-lg border-white/30 text-xs text-white hover:bg-white/10"
          onClick={onAdd}
        >
          Add discount tier
        </Button>
      </div>
      <p className="text-xs text-white/60">
        Offer incentives for longer rentals. Leave a row blank to remove it.
      </p>
      <div className="space-y-4">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/20 px-4 py-3 text-sm text-white/60">
            No duration tiers configured. Add one to reward longer bookings.
          </p>
        ) : null}
        {rows.map((row) => {
          const errors = getErrors(row.id);
          const handleMinDaysChange = (event: ChangeEvent<HTMLInputElement>) =>
            onUpdate(row.id, { minDays: event.target.value });
          const handleRateChange = (event: ChangeEvent<HTMLInputElement>) =>
            onUpdate(row.id, { rate: event.target.value });
          return (
            <div
              key={row.id}
              className="grid gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-white/70">Min days</span>
                <Input
                  type="number"
                  min={1}
                  value={row.minDays}
                  onChange={handleMinDaysChange}
                  aria-invalid={errors.minDays ? "true" : undefined}
                  aria-describedby={errors.minDays ? `${row.id}-minDays-error` : undefined}
                  className="bg-slate-950/80 text-white"
                />
                {errors.minDays ? (
                  <span id={`${row.id}-minDays-error`} className="text-xs text-rose-300">
                    {errors.minDays}
                  </span>
                ) : null}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-white/70">Rate multiplier</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={row.rate}
                  onChange={handleRateChange}
                  aria-invalid={errors.rate ? "true" : undefined}
                  aria-describedby={errors.rate ? `${row.id}-rate-error` : undefined}
                  className="bg-slate-950/80 text-white"
                />
                {errors.rate ? (
                  <span id={`${row.id}-rate-error`} className="text-xs text-rose-300">
                    {errors.rate}
                  </span>
                ) : null}
              </label>
              <div className="flex items-start justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 rounded-lg text-xs text-white/70 hover:bg-white/10"
                  onClick={() => onRemove(row.id)}
                  aria-label={`remove-duration-${row.id}`}
                >
                  Remove
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

