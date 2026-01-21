import { type ChangeEvent } from "react";

import { useTranslations } from "@acme/i18n";

import { Button, Input } from "@/components/atoms/shadcn";

import { type DurationDraft } from "./usePricingFormState";

interface Props {
  rows: DurationDraft[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<DurationDraft, "id">>) => void;
  getErrors: (id: string) => { minDays?: string; rate?: string };
}

export default function PricingDurationSection({ rows, onAdd, onRemove, onUpdate, getErrors }: Props) {
  const t = useTranslations();
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="min-w-0 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("Duration discounts")}</h3>
        <Button
          type="button"
          variant="outline"
          className="h-9 shrink-0 rounded-lg border-border-2 text-xs text-foreground hover:bg-surface-3"
          onClick={onAdd}
        >
          {t("Add discount tier")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("Offer incentives for longer rentals. Leave a row blank to remove it.")}</p>
      <div className="space-y-4">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border-2 px-4 py-3 text-sm text-muted-foreground">
            {t("No duration tiers configured. Add one to reward longer bookings.")}
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
              className="grid gap-3 rounded-xl border border-border-1 bg-surface-2 p-4 sm:grid-cols-3"
            >
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("Min days")}</span>
                <Input
                  type="number"
                  min={1}
                  value={row.minDays}
                  onChange={handleMinDaysChange}
                  aria-invalid={errors.minDays ? "true" : undefined}
                  aria-describedby={errors.minDays ? `${row.id}-minDays-error` : undefined}
                  className="bg-surface-2 text-foreground"
                />
                {errors.minDays ? (
                  <span id={`${row.id}-minDays-error`} className="text-xs text-danger-foreground">
                    {errors.minDays}
                  </span>
                ) : null}
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("Rate multiplier")}</span>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={row.rate}
                  onChange={handleRateChange}
                  aria-invalid={errors.rate ? "true" : undefined}
                  aria-describedby={errors.rate ? `${row.id}-rate-error` : undefined}
                  className="bg-surface-2 text-foreground"
                />
                {errors.rate ? (
                  <span id={`${row.id}-rate-error`} className="text-xs text-danger-foreground">
                    {errors.rate}
                  </span>
                ) : null}
              </label>
              <div className="flex items-start justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 rounded-lg text-xs text-foreground hover:bg-surface-3"
                  onClick={() => onRemove(row.id)}
                  aria-label={`remove-duration-${row.id}`}
                >
                  {t("Remove")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
