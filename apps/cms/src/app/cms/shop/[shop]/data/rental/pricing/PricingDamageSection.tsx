import { Button, Input } from "@/components/atoms/shadcn";
import { cn } from "@ui/utils/style";
import { type ChangeEvent } from "react";

import { type DamageDraft } from "./usePricingFormState";

interface Props {
  rows: DamageDraft[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Omit<DamageDraft, "id">>) => void;
  getErrors: (id: string) => { code?: string; amount?: string };
}

export default function PricingDamageSection({ rows, onAdd, onRemove, onUpdate, getErrors }: Props) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Damage fees</h3>
        <Button
          type="button"
          variant="outline"
          className="h-9 rounded-lg border-border/30 text-xs text-foreground hover:bg-surface-3"
          onClick={onAdd}
        >
          Add damage rule
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Map damage codes to a fixed fee or reuse the deposit amount.</p>
      <div className="space-y-4">
        {rows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/20 px-4 py-3 text-sm text-muted-foreground">
            No damage fees yet. Add codes for your most common incidents.
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
              className="grid gap-3 rounded-xl border border-border/10 bg-surface-2 p-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Damage code</span>
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
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resolution</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={isDeposit ? "ghost" : "outline"}
                    className={cn(
                      "h-9 flex-1 rounded-lg text-xs",
                      isDeposit ? "border-border/10 bg-surface-2 text-foreground" : "border-border/30 text-foreground"
                    )}
                    onClick={() => setMode("amount")}
                  >
                    Fixed fee
                  </Button>
                  <Button
                    type="button"
                    variant={isDeposit ? "outline" : "ghost"}
                    className={cn(
                      "h-9 flex-1 rounded-lg text-xs",
                      isDeposit ? "border-border/30 text-foreground" : "border-border/10 bg-surface-2 text-foreground"
                    )}
                    onClick={() => setMode("deposit")}
                  >
                    Use deposit
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
                  <p className="text-xs text-muted-foreground">Deposit amount will be charged instead of a fixed fee.</p>
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
