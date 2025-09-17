"use client";

// apps/cms/src/app/cms/shop/[shop]/settings/stock-scheduler/StockSchedulerEditor.tsx

import { useMemo, useState, type ChangeEvent } from "react";
import { Toast } from "@/components/atoms";
import { Button, Card, CardContent, Input } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import { updateStockScheduler } from "@cms/actions/stockScheduler.server";

import { ErrorChip } from "../components/ErrorChip";
import {
  toastStyles,
  useServiceEditorForm,
  type ServiceEditorErrors,
} from "../hooks/useServiceEditorForm";

interface HistoryEntry {
  timestamp: number;
  alerts: number;
}

interface Props {
  shop: string;
  status: { intervalMs: number; lastRun?: number; history: HistoryEntry[] };
}

export default function StockSchedulerEditor({ shop, status }: Props) {
  const [interval, setInterval] = useState(String(status.intervalMs || ""));

  const { saving, errors, toast, closeToast, handleSubmit, setErrors } =
    useServiceEditorForm({
      submit: (formData) => updateStockScheduler(shop, formData),
      successMessage: "Stock scheduler updated.",
      errorMessage: "Enter a valid interval to update the scheduler.",
      validate: (formData) => {
        const value = Number(formData.get("intervalMs"));
        if (!value || value <= 0) {
          return { intervalMs: ["Interval must be greater than zero."] } satisfies ServiceEditorErrors;
        }
        return undefined;
      },
    });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInterval(event.target.value);
    if (errors.intervalMs) {
      setErrors((current) => {
        const next = { ...current };
        delete next.intervalMs;
        return next;
      });
    }
  };

  const history = useMemo(() => status.history.slice().reverse(), [status.history]);

  return (
    <>
      <Card className="max-w-2xl">
        <CardContent className="space-y-6 p-6">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <FormField
              label="Check interval"
              htmlFor="stock-scheduler-interval"
              error={<ErrorChip error={errors.intervalMs} />}
            >
              <Input
                id="stock-scheduler-interval"
                name="intervalMs"
                type="number"
                inputMode="numeric"
                min={1}
                value={interval}
                onChange={handleChange}
                placeholder="60000"
              />
              <p className="text-xs text-muted-foreground">
                Frequency in milliseconds between inventory checks.
              </p>
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save scheduler"}
              </Button>
            </div>
          </form>
          <div className="rounded-md border border-border bg-muted/30 p-4 text-sm">
            <p>
              <span className="font-medium">Last run:</span>{" "}
              {status.lastRun
                ? new Date(status.lastRun).toLocaleString()
                : "Never"}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="max-w-2xl">
        <CardContent className="space-y-4 p-6">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Recent checks
            </h3>
            <p className="text-xs text-muted-foreground">
              Snapshot of the most recent scheduler runs and alerts emitted.
            </p>
          </div>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No checks yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted-foreground">
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Alerts</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.timestamp} className="border-t border-border/60">
                    <td className="py-2 pr-4">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2">{entry.alerts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      <Toast
        open={toast.open}
        message={toast.message}
        className={toastStyles[toast.status]}
        onClose={closeToast}
      />
    </>
  );
}
