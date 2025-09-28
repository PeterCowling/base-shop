import { Button, Input } from "@/components/atoms/shadcn";
import { cn } from "@ui/utils/style";
import { type ChangeEvent } from "react";
import { useTranslations } from "@acme/i18n";

import { type DamageDraft } from "./usePricingFormState";
import { BTN_BASE, VARIANT_A, VARIANT_B } from "./styles";

interface Props {
  rows: DamageDraft[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<DamageDraft, "id">>) => void;
  getErrors: (id: string) => { code?: string; amount?: string };
}

export default function PricingDamageSection({ rows, onAdd, onRemove, onUpdate, getErrors }: Props) {
  const t = useTranslations();
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="min-w-0 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("cms.pricing.damage.title")}</h3>
        <Button
          type="button"
          variant="outline"
          className="h-9 shrink-0 rounded-lg border-border-2 text-xs text-foreground hover:bg-surface-3"
          onClick={onAdd}
        >
          {t("cms.pricing.damage.addRule")}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">{t("cms.pricing.damage.subtitle")}</p>
      <div className="space-y-4">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border-2 px-4 py-3 text-sm text-muted-foreground">
            {t("cms.pricing.damage.empty")}
          </p>
        ) : null}
        {rows.map((row) => {
          const errors = getErrors(row.id);
          const handleCodeChange = (event: ChangeEvent<HTMLInputElement>) =>
            onUpdate(row.id, { code: event.target.value });
          const handleAmountChange = (event: ChangeEvent<HTMLInputElement>) =>
            onUpdate(row.id, { amount: event.target.value });
          const setMode = (mode: DamageDraft["mode"]) =>
            onUpdate(row.id, { mode, ...(mode === "deposit" ? { amount: "" } : {}) });
          const isDeposit = row.mode === "deposit";

          return (
            <div
              key={row.id}
              className="grid gap-3 rounded-xl border border-border-1 bg-surface-2 p-4 sm:grid-cols-3"
            >
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("cms.pricing.damage.code")}</span>
                <Input
                  value={row.code}
                  onChange={handleCodeChange}
                  aria-invalid={errors.code ? "true" : undefined}
                  aria-describedby={errors.code ? `${row.id}-code-error` : undefined}
                  className="bg-surface-2 text-foreground"
                />
                {errors.code ? (
                  <span id={`${row.id}-code-error`} className="text-xs text-danger-foreground">
                    {errors.code}
                  </span>
                ) : null}
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("cms.pricing.damage.resolution")}</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={isDeposit ? "ghost" : "outline"}
                    className={cn(BTN_BASE, isDeposit ? VARIANT_A : VARIANT_B)}
                    onClick={() => setMode("amount")}
                  >
                    {t("cms.pricing.damage.fixedFee")}
                  </Button>
                  <Button
                    type="button"
                    variant={isDeposit ? "outline" : "ghost"}
                    className={cn(BTN_BASE, isDeposit ? VARIANT_B : VARIANT_A)}
                    onClick={() => setMode("deposit")}
                  >
                    {t("cms.pricing.damage.useDeposit")}
                  </Button>
                </div>
                {!isDeposit ? (
                  <div className="flex flex-col gap-1">
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={row.amount}
                      onChange={handleAmountChange}
                      aria-invalid={errors.amount ? "true" : undefined}
                      aria-describedby={errors.amount ? `${row.id}-amount-error` : undefined}
                      className="bg-surface-2 text-foreground"
                    />
                    {errors.amount ? (
                      <span id={`${row.id}-amount-error`} className="text-xs text-danger-foreground">
                        {errors.amount}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("cms.pricing.damage.depositHint")}</p>
                )}
              </div>
              <div className="flex items-start justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 rounded-lg text-xs text-foreground hover:bg-surface-3"
                  onClick={() => onRemove(row.id)}
                  aria-label={`remove-damage-${row.id}`}
                >
                  {t("actions.remove")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
