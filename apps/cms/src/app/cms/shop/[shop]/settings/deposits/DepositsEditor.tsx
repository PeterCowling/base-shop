"use client";

import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";

import { Toast } from "@/components/atoms";
import { Button, Card, CardContent, Input } from "@/components/atoms/shadcn";
import { FormField } from "@acme/ui/components/molecules";
import { updateDeposit } from "@cms/actions/shops.server";

import { ErrorChips } from "../components/ErrorChips";
import { ServiceToggleField } from "../components/ServiceToggleField";
import { useSettingsSaveForm } from "../hooks/useSettingsSaveForm";

const INTERVAL_ERROR_MESSAGE = "Enter an interval of at least one minute.";

type DepositState = {
  enabled: boolean;
  intervalMinutes: string;
};

type DepositResult = Awaited<ReturnType<typeof updateDeposit>>;

interface Props {
  shop: string;
  initial: { enabled: boolean; intervalMinutes: number };
}

export default function DepositsEditor({ shop, initial }: Props) {
  const [state, setState] = useState<DepositState>({
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
  } = useSettingsSaveForm<DepositResult>({
      action: (formData) => updateDeposit(shop, formData),
      successMessage: "Deposit service updated.",
      errorMessage: "Unable to update deposit service.",
      onSuccess: (result) => {
        const next = result.settings?.depositService;
        if (!next) return;
        setState({
          enabled: next.enabled,
          intervalMinutes: String(next.intervalMinutes),
        });
      },
    });

  const handleEnabledChange = useCallback(
    (checked: boolean) => {
      setState((current) => ({ ...current, enabled: checked }));
      if (errors.enabled?.length) {
        setErrors((current) => {
          const next = { ...current };
          delete next.enabled;
          return next;
        });
      }
    },
    [errors.enabled, setErrors],
  );

  const handleIntervalChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setState((current) => ({
        ...current,
        intervalMinutes: value,
      }));

      if (errors.intervalMinutes?.length) {
        setErrors((current) => {
          const next = { ...current };
          delete next.intervalMinutes;
          return next;
        });
      }
    },
    [errors.intervalMinutes, setErrors],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const rawInterval = formData.get("intervalMinutes");
      const intervalValue =
        typeof rawInterval === "string" && rawInterval.trim().length > 0
          ? Number(rawInterval)
          : Number.NaN;

      if (Number.isNaN(intervalValue) || intervalValue < 1) {
        setErrors((current) => ({
          ...current,
          intervalMinutes: [INTERVAL_ERROR_MESSAGE],
        }));
        announceError(INTERVAL_ERROR_MESSAGE);
        return;
      }

      void submit(formData);
    },
    [announceError, setErrors, submit],
  );

  return (
    <>
      <Card className="border border-border/60">
        <CardContent className="space-y-6 p-6">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <ServiceToggleField
              id="deposit-enabled"
              name="enabled"
              label="Deposit release"
              description="Enable automatic deposit releases at the cadence below."
              checked={state.enabled}
              onChange={handleEnabledChange}
              errors={errors.enabled}
            />

            <FormField
              label="Interval (minutes)"
              htmlFor="deposit-interval"
              error={<ErrorChips errors={errors.intervalMinutes} />}
              className="gap-3"
            >
              <Input
                id="deposit-interval"
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
