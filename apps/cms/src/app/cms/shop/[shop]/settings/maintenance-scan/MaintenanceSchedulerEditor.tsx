"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

import { Toast } from "@/components/atoms";
import { Button, Card, CardContent, Input } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import { updateMaintenanceSchedule } from "@cms/actions/maintenance.server";

import { ErrorChips } from "../components/ErrorChips";
import { useSettingsSaveForm } from "../hooks/useSettingsSaveForm";

export default function MaintenanceSchedulerEditor() {
  const [frequency, setFrequency] = useState("");

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
      await updateMaintenanceSchedule(formData);
    },
    successMessage: "Maintenance scan schedule updated.",
    errorMessage: "Unable to update maintenance scan schedule.",
    normalizeErrors: () => undefined,
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFrequency(event.target.value);
    if (errors.frequency?.length) {
      setErrors((current) => {
        const next = { ...current };
        delete next.frequency;
        return next;
      });
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = Number(formData.get("frequency"));

    if (!Number.isFinite(value) || value <= 0) {
      setErrors({ frequency: ["Enter a frequency greater than zero."] });
      announceError("Frequency must be at least 1 millisecond.");
      return;
    }
    formData.set("frequency", String(value));
    void submit(formData);
  };

  return (
    <>
      <Card className="border border-border/60">
        <CardContent className="space-y-6 p-6">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <FormField
              label="Scan frequency (ms)"
              htmlFor="maintenance-frequency"
              className="gap-3"
            >
              <Input
                id="maintenance-frequency"
                name="frequency"
                type="number"
                min="1"
                value={frequency}
                onChange={handleChange}
              />
              <ErrorChips errors={errors.frequency} />
              <p className="text-xs text-muted-foreground">
                Configure how often the automated maintenance scan should run.
              </p>
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
