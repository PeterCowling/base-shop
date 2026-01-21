"use client";

import { type ChangeEvent, type FormEvent,useMemo, useState } from "react";
import { updateStockScheduler } from "@cms/actions/stockScheduler.server";

import { useTranslations } from "@acme/i18n/Translations";
import DataTable from "@acme/ui/components/cms/DataTable";
import { FormField } from "@acme/ui/components/molecules";

import { Toast } from "@/components/atoms";
import { Button, Card, CardContent, Input } from "@/components/atoms/shadcn";

import { ErrorChips } from "../components/ErrorChips";
import { useSettingsSaveForm } from "../hooks/useSettingsSaveForm";
import {
  mapSchedulerHistoryRows,
  schedulerHistoryColumns,
} from "../tableMappers";

interface HistoryEntry {
  timestamp: number;
  alerts: number;
}

interface Props {
  shop: string;
  status: { intervalMs: number; lastRun?: number; history: HistoryEntry[] };
}

export default function StockSchedulerEditor({ shop, status }: Props) {
  const t = useTranslations();
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
      successMessage: String(t("cms.stockScheduler.updated")),
      errorMessage: String(t("cms.stockScheduler.updateError")),
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
      setErrors({ intervalMs: [String(t("cms.stockScheduler.interval.invalidGreaterThanZero"))] });
      announceError(String(t("cms.stockScheduler.interval.min")));
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
              label={t("cms.stockScheduler.interval.label")}
              htmlFor="stock-scheduler-interval"
              error={
                errors.intervalMs?.length ? (
                  <ErrorChips errors={errors.intervalMs} />
                ) : undefined
              }
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
                {saving ? t("actions.saving") : t("actions.saveChanges")}
              </Button>
            </div>
          </form>

          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              {t("cms.stockScheduler.lastRun")}{" "}
              {status.lastRun
                ? new Date(status.lastRun).toLocaleString()
                : t("cms.stockScheduler.never")}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">{t("cms.stockScheduler.recentChecks")}</h3>
            {historyRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("cms.stockScheduler.noChecksYet")}</p>
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
