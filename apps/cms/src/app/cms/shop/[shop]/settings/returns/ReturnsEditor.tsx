"use client";

import { useState } from "react";

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

interface Props {
  shop: string;
  initial: ReturnsState;
}

export default function ReturnsEditor({ shop, initial }: Props) {
  const [state, setState] = useState<ReturnsState>(initial);

  const { saving, errors, handleSubmit, toast, toastClassName, closeToast } =
    useSettingsSaveForm<ReturnsResult>({
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

  return (
    <>
      <Card className="border border-border/60">
        <CardContent className="space-y-6 p-6">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <ServiceToggleField
              id="returns-ups"
              name="enabled"
              label="UPS returns"
              description="Allow shoppers to generate UPS labels for their returns."
              checked={state.upsEnabled}
              onChange={(checked) =>
                setState((current) => ({ ...current, upsEnabled: checked }))
              }
              errors={errors.enabled}
            />

            <ServiceToggleField
              id="returns-bag"
              name="bagEnabled"
              label="Return bags"
              description="Offer pre-paid return bags in outgoing shipments."
              checked={state.bagEnabled}
              onChange={(checked) =>
                setState((current) => ({ ...current, bagEnabled: checked }))
              }
            />

            <ServiceToggleField
              id="returns-pickup"
              name="homePickupEnabled"
              label="Home pickup"
              description="Coordinate home pickup appointments for approved returns."
              checked={state.homePickupEnabled}
              onChange={(checked) =>
                setState((current) => ({
                  ...current,
                  homePickupEnabled: checked,
                }))
              }
            />

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
