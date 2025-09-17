"use client";

import { useState } from "react";

import { Toast } from "@/components/atoms";
import { Button, Card, CardContent, Input } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import { updateReverseLogistics } from "@cms/actions/shops.server";

import { ErrorChips } from "../components/ErrorChips";
import { ServiceToggleField } from "../components/ServiceToggleField";
import { useServiceEditorForm } from "../hooks/useServiceEditorForm";

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

  const { saving, errors, handleSubmit, toast, toastClassName, closeToast } =
    useServiceEditorForm<ReverseLogisticsResult>({
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
              onChange={(checked) =>
                setState((current) => ({ ...current, enabled: checked }))
              }
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
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    intervalMinutes: event.target.value,
                  }))
                }
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
