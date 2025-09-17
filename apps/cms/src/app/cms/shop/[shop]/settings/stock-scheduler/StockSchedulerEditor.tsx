"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";

import { Toast } from "@/components/atoms";
import { Button, Card, CardContent, Input } from "@/components/atoms/shadcn";
import DataTable from "@ui/components/cms/DataTable";
import { FormField } from "@ui/components/molecules";
import { updateStockScheduler } from "@cms/actions/stockScheduler.server";

import {
  mapSchedulerHistoryRows,
  schedulerHistoryColumns,
} from "../tableMappers";
import { ErrorChips } from "../components/ErrorChips";
import { useSettingsSaveForm } from "../hooks/useSettingsSaveForm";

interface HistoryEntry {
  timestamp: number;
  alerts: number;
}

interface Props {
  shop: string;
  status: { intervalMs: number; lastRun?: number; history: HistoryEntry[] };
}

export default function StockSchedulerEditor({ shop, status }: Props) {
  const [interval, setInterval] = useState(String(status.intervalMs));

  const historyRows = useMemo(
    () => mapSchedulerHistoryRows(status.history),
    [status.history],
  );

  const {
    saving,
    errors,
    setErrors,
    submit,
    toast,
    toastClassName,
    closeToast,
    announceError,
    } = useSettingsSaveForm<void>({
      action: async (formData) => {
        await updateStockScheduler(shop, formData);
      },
      successMessage: "Stock scheduler updated.",
      errorMessage: "Unable to update stock scheduler.",
      normalizeErrors: () => undefined,
    });

  const handleIntervalChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInterval(event.target.value);
    if (!errors.intervalMs?.length) {
      return;
    }
    setErrors(({ intervalMs: _interval, ...rest }) => rest);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawInterval = formData.get("intervalMs");
    const numericInterval = Number(rawInterval);
    const hasValidInterval =
      Number.isFinite(numericInterval) && numericInterval > 0;

    if (!hasValidInterval) {
      setErrors({ intervalMs: ["Enter an interval greater than zero."] });
      announceError("Interval must be at least 1 millisecond.");
      return;
    }

    formData.set("intervalMs", numericInterval.toString());
    void submit(formData);
  };

  return (
    <>
      <Card className="border border-border/60">
        <CardContent className="space-y-6 p-6">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <FormField
              label="Check interval (ms)"
              htmlFor="stock-scheduler-interval"
              error={<ErrorChips errors={errors.intervalMs} />}
              className="gap-3"
            >
              <Input
                id="stock-scheduler-interval"
                name="intervalMs"
                type="number"
                min="1"
                value={interval}
                onChange={handleIntervalChange}
              />
            </FormField>
            <div className="flex justify-end">
              <Button
                type="submit"
                className="h-10 px-6 text-sm font-semibold"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Last run:{' '}
              {status.lastRun
                ? new Date(status.lastRun).toLocaleString()
                : "Never"}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Recent checks</h3>
            {historyRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No checks yet.</p>
            ) : (
              <div className="overflow-hidden rounded-md border border-border/60">
                <DataTable rows={historyRows} columns={schedulerHistoryColumns} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={closeToast}
        className={toastClassName}
        role="status"
      />
    </>
  );
}
