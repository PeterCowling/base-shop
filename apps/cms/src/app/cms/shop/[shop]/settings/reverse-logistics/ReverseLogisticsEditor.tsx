"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

import { Toast } from "@/components/atoms";
import { Button, Card, CardContent, Input } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import { updateReverseLogistics } from "@cms/actions/shops.server";

import { ErrorChips } from "../components/ErrorChips";
import { ServiceToggleField } from "../components/ServiceToggleField";
import { useSettingsSaveForm } from "../hooks/useSettingsSaveForm";

type ReverseLogisticsState = {
  enabled: boolean;
  intervalMinutes: string;
};

type ReverseLogisticsResult = Awaited<ReturnType<typeof updateReverseLogistics>>;

interface Props {
  shop: string;
  initial: { enabled: boolean; intervalMinutes: number };
}

export default function ReverseLogisticsEditor({ shop, initial }: Props) {
  const [state, setState] = useState<ReverseLogisticsState>({
    enabled: initial.enabled,
    intervalMinutes: String(initial.intervalMinutes ?? 60),
  });

  const {
    saving,
    errors,
    setErrors,
    submit,
    toast,
    toastClassName,
    closeToast,
    announceError,
  } = useSettingsSaveForm<ReverseLogisticsResult>({
    action: (formData) => updateReverseLogistics(shop, formData),
    successMessage: "Reverse logistics updated.",
    errorMessage: "Unable to update reverse logistics settings.",
    onSuccess: (result) => {
      const next = result.settings?.reverseLogisticsService;
      if (!next) return;
      setState({
        enabled: next.enabled,
        intervalMinutes: String(next.intervalMinutes),
      });
    },
  });

  const handleEnabledChange = (checked: boolean) => {
    setState((current) => ({ ...current, enabled: checked }));
    setErrors((current) => {
      if (!current.enabled) {
        return current;
      }
      const next = { ...current };
      delete next.enabled;
      return next;
    });
  };

  const handleIntervalChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setState((current) => ({ ...current, intervalMinutes: value }));
    setErrors((current) => {
      if (!current.intervalMinutes) {
        return current;
      }
      const next = { ...current };
      delete next.intervalMinutes;
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const rawInterval = formData.get("intervalMinutes");
    const intervalValue =
      typeof rawInterval === "string" && rawInterval.trim() !== ""
        ? Number(rawInterval)
        : NaN;

    if (!Number.isFinite(intervalValue) || intervalValue <= 0) {
      const intervalError = "Enter an interval greater than zero.";
      setErrors((current) => ({
        ...current,
        intervalMinutes: [intervalError],
      }));
      announceError("Interval must be at least 1 minute.");
      return;
    }

    void submit(formData);
  };

  return (
    <>
      <Card className="border border-border/60">
        <CardContent className="space-y-6 p-6">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <ServiceToggleField
              id="reverse-logistics-enabled"
              name="enabled"
              label="Reverse logistics"
              description="Automate return-to-vendor and refurbishment workflows."
              checked={state.enabled}
              onChange={handleEnabledChange}
              errors={errors.enabled}
            />

            <FormField
              label="Interval (minutes)"
              htmlFor="reverse-logistics-interval"
              error={<ErrorChips errors={errors.intervalMinutes} />}
              className="gap-3"
            >
              <Input
                id="reverse-logistics-interval"
                name="intervalMinutes"
                type="number"
                min="1"
                value={state.intervalMinutes}
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
