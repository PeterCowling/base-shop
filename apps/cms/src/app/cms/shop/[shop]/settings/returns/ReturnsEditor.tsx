"use client";

import { useState } from "react";
import { Toast, Switch } from "@/components/atoms";
import { Button, Card, CardContent } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import { updateUpsReturns } from "@cms/actions/shops.server";

import { ErrorChip } from "../components/ErrorChip";
import { toastStyles, useServiceEditorForm } from "../hooks/useServiceEditorForm";

interface Props {
  shop: string;
  initial: { upsEnabled: boolean; bagEnabled: boolean; homePickupEnabled: boolean };
}

export default function ReturnsEditor({ shop, initial }: Props) {
  const [form, setForm] = useState(initial);

  const { saving, errors, toast, closeToast, handleSubmit, setErrors } =
    useServiceEditorForm({
      submit: (formData) => updateUpsReturns(shop, formData),
      successMessage: "Return options updated.",
      errorMessage: "Fix the highlighted fields to save return settings.",
      onSuccess: (result) => {
        const service = result?.settings?.returnService;
        if (service) {
          setForm({
            upsEnabled: service.upsEnabled,
            bagEnabled: service.bagEnabled ?? false,
            homePickupEnabled: service.homePickupEnabled ?? false,
          });
        }
      },
    });

  const toggleField = (field: keyof typeof form) => (checked: boolean) => {
    setForm((previous) => ({ ...previous, [field]: checked }));
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
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
              label="UPS returns"
              htmlFor="returns-ups-enabled"
              error={<ErrorChip error={errors.enabled} />}
            >
              <div className="flex items-start justify-between rounded-md border border-border bg-muted/40 p-4">
                <div className="space-y-1 pr-4">
                  <p className="text-sm font-medium text-foreground">Enable service</p>
                  <p className="text-xs text-muted-foreground">
                    Allow customers to create UPS return labels in the portal.
                  </p>
                </div>
                <Switch
                  id="returns-ups-enabled"
                  name="enabled"
                  checked={form.upsEnabled}
                  onChange={(event) => toggleField("upsEnabled")(event.target.checked)}
                />
              </div>
            </FormField>
            <FormField
              label="Return bag fulfillment"
              htmlFor="returns-bag-enabled"
              error={<ErrorChip error={errors.bagEnabled} />}
            >
              <div className="flex items-start justify-between rounded-md border border-border bg-muted/20 p-4">
                <div className="space-y-1 pr-4">
                  <p className="text-sm font-medium text-foreground">Provide reusable bags</p>
                  <p className="text-xs text-muted-foreground">
                    Include branded packaging with each return to encourage exchanges.
                  </p>
                </div>
                <Switch
                  id="returns-bag-enabled"
                  name="bagEnabled"
                  checked={form.bagEnabled}
                  onChange={(event) => toggleField("bagEnabled")(event.target.checked)}
                />
              </div>
            </FormField>
            <FormField
              label="Home pickup"
              htmlFor="returns-pickup-enabled"
              error={<ErrorChip error={errors.homePickupEnabled} />}
            >
              <div className="flex items-start justify-between rounded-md border border-border bg-muted/20 p-4">
                <div className="space-y-1 pr-4">
                  <p className="text-sm font-medium text-foreground">Schedule pickups</p>
                  <p className="text-xs text-muted-foreground">
                    Let shoppers request at-home courier pickups for eligible orders.
                  </p>
                </div>
                <Switch
                  id="returns-pickup-enabled"
                  name="homePickupEnabled"
                  checked={form.homePickupEnabled}
                  onChange={(event) => toggleField("homePickupEnabled")(event.target.checked)}
                />
              </div>
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save return settings"}
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
