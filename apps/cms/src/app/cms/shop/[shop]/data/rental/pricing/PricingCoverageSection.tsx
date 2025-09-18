import { Card, CardContent, Checkbox, Input } from "@/components/atoms/shadcn";
import { type ChangeEvent } from "react";

import { type CoverageDraft } from "./usePricingFormState";

interface Props {
  rows: CoverageDraft[];
  onUpdate: (code: CoverageDraft["code"], updates: Partial<Omit<CoverageDraft, "code">>) => void;
  getErrors: (code: CoverageDraft["code"]) => { fee?: string; waiver?: string };
}

export default function PricingCoverageSection({ rows, onUpdate, getErrors }: Props) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-white/80">Coverage fees</h3>
      <p className="text-xs text-white/60">
        Enable optional coverage to offset repair costs. Leave unchecked to skip offering the coverage.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {rows.map((row) => {
          const errors = getErrors(row.code);
          const handleFeeChange = (event: ChangeEvent<HTMLInputElement>) =>
            onUpdate(row.code, { fee: event.target.value });
          const handleWaiverChange = (event: ChangeEvent<HTMLInputElement>) =>
            onUpdate(row.code, { waiver: event.target.value });
          const handleToggle = (checked: boolean | "indeterminate") =>
            onUpdate(row.code, { enabled: Boolean(checked) });

          return (
            <Card key={row.code} className="border border-white/10 bg-slate-900/60 text-white">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold capitalize">{row.code}</span>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    <Checkbox id={`coverage-${row.code}`} checked={row.enabled} onCheckedChange={handleToggle} />
                    <label htmlFor={`coverage-${row.code}`}>Offer coverage</label>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-wide text-white/70" htmlFor={`coverage-fee-${row.code}`}>
                    Coverage fee
                  </label>
                  <Input
                    id={`coverage-fee-${row.code}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.fee}
                    onChange={handleFeeChange}
                    disabled={!row.enabled}
                    aria-invalid={errors.fee ? "true" : undefined}
                    aria-describedby={errors.fee ? `coverage-${row.code}-fee-error` : undefined}
                    className="bg-slate-950/80 text-white disabled:opacity-40"
                  />
                  {errors.fee ? (
                    <span id={`coverage-${row.code}-fee-error`} className="text-xs text-rose-300">
                      {errors.fee}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1">
                  <label
                    className="text-xs uppercase tracking-wide text-white/70"
                    htmlFor={`coverage-waiver-${row.code}`}
                  >
                    Waiver limit
                  </label>
                  <Input
                    id={`coverage-waiver-${row.code}`}
                    type="number"
                    min={0}
                    step="0.01"
                    value={row.waiver}
                    onChange={handleWaiverChange}
                    disabled={!row.enabled}
                    aria-invalid={errors.waiver ? "true" : undefined}
                    aria-describedby={errors.waiver ? `coverage-${row.code}-waiver-error` : undefined}
                    className="bg-slate-950/80 text-white disabled:opacity-40"
                  />
                  {errors.waiver ? (
                    <span id={`coverage-${row.code}-waiver-error`} className="text-xs text-rose-300">
                      {errors.waiver}
                    </span>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

