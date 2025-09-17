"use client";

// apps/cms/src/app/cms/shop/[shop]/settings/maintenance-scan/MaintenanceSchedulerEditor.tsx

import { useState, type ChangeEvent } from "react";
import { Toast } from "@/components/atoms";
import { Button, Card, CardContent, Input } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import { updateMaintenanceSchedule } from "@cms/actions/maintenance.server";

import { ErrorChip } from "../components/ErrorChip";
import {
  toastStyles,
  useServiceEditorForm,
  type ServiceEditorErrors,
} from "../hooks/useServiceEditorForm";

export default function MaintenanceSchedulerEditor() {
  const [frequency, setFrequency] = useState("");

  const {
    saving,
    errors,
    toast,
    closeToast,
    handleSubmit,
    setErrors,
  } = useServiceEditorForm({
    submit: updateMaintenanceSchedule,
    successMessage: "Maintenance scan schedule updated.",
    errorMessage: "Enter a valid frequency to update the maintenance scan.",
    validate: (formData) => {
      const value = Number(formData.get("frequency"));
      if (!value || value <= 0) {
        return { frequency: ["Frequency must be greater than zero."] } satisfies ServiceEditorErrors;
      }
      return undefined;
    },
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFrequency(event.target.value);
    if (errors.frequency) {
      setErrors((current) => {
        const next = { ...current };
        delete next.frequency;
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
              label="Scan frequency"
              htmlFor="maintenance-frequency"
              error={<ErrorChip error={errors.frequency} />}
            >
              <Input
                id="maintenance-frequency"
                name="frequency"
                type="number"
                inputMode="numeric"
                min={1}
                value={frequency}
                onChange={handleChange}
                placeholder="60000"
              />
              <p className="text-xs text-muted-foreground">
                Define how often the automated scan runs. Minimum value is 1 millisecond.
              </p>
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save schedule"}
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

