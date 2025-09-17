"use client";

import { useState, type FormEvent } from "react";

import { Toast } from "@/components/atoms";
import { Button, Card, CardContent } from "@/components/atoms/shadcn";
import { updateUpsReturns } from "@cms/actions/shops.server";

import { ServiceToggleField } from "../components/ServiceToggleField";
import { useSettingsSaveForm } from "../hooks/useSettingsSaveForm";

type ReturnsState = {
  upsEnabled: boolean;
  bagEnabled: boolean;
  homePickupEnabled: boolean;
};

type ReturnsResult = Awaited<ReturnType<typeof updateUpsReturns>>;

const MIN_SELECTION_MESSAGE = "Select at least one return option before saving.";

interface Props {
  shop: string;
  initial: ReturnsState;
}

export default function ReturnsEditor({ shop, initial }: Props) {
  const [state, setState] = useState<ReturnsState>(initial);

  const {
    saving,
    errors,
    setErrors,
    submit,
    toast,
    toastClassName,
    closeToast,
    announceError,
  } = useSettingsSaveForm<ReturnsResult>({
    action: (formData) => updateUpsReturns(shop, formData),
    successMessage: "Return options updated.",
    errorMessage: "Unable to update return options.",
    onSuccess: (result) => {
      const next = result.settings?.returnService;
      if (!next) return;
      setState({
        upsEnabled: next.upsEnabled,
        bagEnabled: next.bagEnabled ?? false,
        homePickupEnabled: next.homePickupEnabled ?? false,
      });
    },
  });

  const clearFieldError = (field: string) => {
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const updateToggle = (key: keyof ReturnsState) => (checked: boolean) => {
    setState((current) => {
      const next = { ...current, [key]: checked };
      if (next.upsEnabled || next.bagEnabled || next.homePickupEnabled) {
        clearFieldError("enabled");
      }
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hasSelection =
      state.upsEnabled || state.bagEnabled || state.homePickupEnabled;

    if (!hasSelection) {
      setErrors((current) => ({ ...current, enabled: [MIN_SELECTION_MESSAGE] }));
      announceError(MIN_SELECTION_MESSAGE);
      return;
    }

    const formData = new FormData(event.currentTarget);
    clearFieldError("enabled");
    void submit(formData);
  };

  return (
    <>
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <Card className="border border-border/60">
          <CardContent className="space-y-6 p-6">
            <ServiceToggleField
              id="returns-ups"
              name="enabled"
              label="UPS returns"
              description="Allow shoppers to generate UPS labels for their returns."
              checked={state.upsEnabled}
              onChange={updateToggle("upsEnabled")}
              errors={errors.enabled}
            />

            <ServiceToggleField
              id="returns-bag"
              name="bagEnabled"
              label="Return bags"
              description="Offer pre-paid return bags in outgoing shipments."
              checked={state.bagEnabled}
              onChange={updateToggle("bagEnabled")}
              errors={errors.bagEnabled}
            />

            <ServiceToggleField
              id="returns-pickup"
              name="homePickupEnabled"
              label="Home pickup"
              description="Coordinate home pickup appointments for approved returns."
              checked={state.homePickupEnabled}
              onChange={updateToggle("homePickupEnabled")}
              errors={errors.homePickupEnabled}
            />
          </CardContent>
        </Card>

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
