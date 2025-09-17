"use client";

import { useState } from "react";
import { Toast, Switch } from "@/components/atoms";
import { Button, Card, CardContent, Input } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import { updateReverseLogistics } from "@cms/actions/shops.server";

import { ErrorChip } from "../components/ErrorChip";
import { toastStyles, useServiceEditorForm } from "../hooks/useServiceEditorForm";

interface Props {
  shop: string;
  initial: { enabled: boolean; intervalMinutes: number };
}

export default function ReverseLogisticsEditor({ shop, initial }: Props) {
  const [form, setForm] = useState(initial);

  const { saving, errors, toast, closeToast, handleSubmit, setErrors } =
    useServiceEditorForm({
      submit: (formData) => updateReverseLogistics(shop, formData),
      successMessage: "Reverse logistics updated.",
      errorMessage: "Fix the highlighted fields to save reverse logistics.",
      onSuccess: (result) => {
        const latest = result?.settings?.reverseLogisticsService;
        if (latest) {
          setForm(latest);
        }
      },
    });

  const updateEnabled = (checked: boolean) => {
    setForm((previous) => ({ ...previous, enabled: checked }));
  };

  const updateInterval = (value: string) => {
    setForm((previous) => ({ ...previous, intervalMinutes: Number(value) }));
    if (errors.intervalMinutes) {
      setErrors((current) => {
        const next = { ...current };
        delete next.intervalMinutes;
        return next;
      });
    }
  };

  return (
    <>
      <Card className="max-w-xl">
        <CardContent className="space-y-6 p-6">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <FormField
              label="Reverse logistics"
              htmlFor="reverse-logistics-enabled"
              error={<ErrorChip error={errors.enabled} />}
            >
              <div className="flex items-start justify-between rounded-md border border-border bg-muted/40 p-4">
                <div className="space-y-1 pr-4">
                  <p className="text-sm font-medium text-foreground">
                    Enable service
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Queue outbound carriers to retrieve return packages on a schedule.
                  </p>
                </div>
                <Switch
                  id="reverse-logistics-enabled"
                  name="enabled"
                  checked={form.enabled}
                  onChange={(event) => updateEnabled(event.target.checked)}
                />
              </div>
            </FormField>
            <FormField
              label="Check interval"
              htmlFor="reverse-logistics-interval"
              error={<ErrorChip error={errors.intervalMinutes} />}
            >
              <Input
                id="reverse-logistics-interval"
                name="intervalMinutes"
                type="number"
                inputMode="numeric"
                min={1}
                value={form.intervalMinutes}
                onChange={(event) => updateInterval(event.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Interval in minutes between collection batches. Minimum value is 1 minute.
              </p>
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save reverse logistics"}
              </Button>
            </div>
          </form>
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
