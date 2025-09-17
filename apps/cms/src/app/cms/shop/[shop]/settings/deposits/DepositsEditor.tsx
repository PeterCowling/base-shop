"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

import { Toast } from "@/components/atoms";
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Input,
} from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import { updateDeposit } from "@cms/actions/shops.server";

import { ErrorChips } from "../components/ErrorChips";
import { useSettingsSaveForm } from "../hooks/useSettingsSaveForm";

type DepositState = {
  enabled: boolean;
  intervalMinutes: string;
};

type DepositResult = Awaited<ReturnType<typeof updateDeposit>>;

interface Props {
  shop: string;
  initial: { enabled: boolean; intervalMinutes: number };
}

const INTERVAL_ERROR_MESSAGE = "Enter an interval of at least 1 minute.";

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

  const handleEnabledChange = (checked: boolean | "indeterminate") => {
    setState((current) => ({ ...current, enabled: Boolean(checked) }));
    if (errors.enabled?.length) {
      setErrors((current) => {
        const next = { ...current };
        delete next.enabled;
        return next;
      });
    }
  };

  const handleIntervalChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setState((current) => ({ ...current, intervalMinutes: value }));
    if (errors.intervalMinutes?.length) {
      setErrors((current) => {
        const next = { ...current };
        delete next.intervalMinutes;
        return next;
      });
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const intervalValue = formData.get("intervalMinutes");
    const intervalNumber =
      typeof intervalValue === "string" && intervalValue.trim().length > 0
        ? Number(intervalValue)
        : NaN;

    if (!intervalValue || Number.isNaN(intervalNumber) || intervalNumber < 1) {
      setErrors((current) => ({
        ...current,
        intervalMinutes: [INTERVAL_ERROR_MESSAGE],
      }));
      announceError(INTERVAL_ERROR_MESSAGE);
      return;
    }

    void submit(formData);
  };

  return (
    <>
      <Card className="border border-border/60">
        <CardContent className="space-y-6 p-6">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <FormField
              label="Deposit release"
              htmlFor="deposit-enabled"
              className="gap-3"
            >
              <div className="flex items-start gap-3 rounded-md border border-border/60 bg-muted/10 px-4 py-3">
                <Checkbox
                  id="deposit-enabled"
                  name="enabled"
                  checked={state.enabled}
                  onCheckedChange={handleEnabledChange}
                  aria-describedby="deposit-enabled-description"
                />
                <p
                  id="deposit-enabled-description"
                  className="flex-1 text-sm text-muted-foreground"
                >
                  Enable automatic deposit releases at the cadence below.
                </p>
              </div>
              <ErrorChips errors={errors.enabled} />
            </FormField>

            <FormField
              label="Interval (minutes)"
              htmlFor="deposit-interval"
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
              <ErrorChips errors={errors.intervalMinutes} />
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
