"use client";

import { useState } from "react";
import { Toast } from "@/components/atoms";
import { Button, Card, CardContent, Input } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import { updatePremierDelivery } from "@cms/actions/shops.server";

import { CollectionField } from "../components/CollectionField";
import { ErrorChip } from "../components/ErrorChip";
import { toastStyles, useServiceEditorForm } from "../hooks/useServiceEditorForm";

interface Props {
  shop: string;
  initial: {
    regions: string[];
    windows: string[];
    carriers?: string[];
    surcharge?: number;
    serviceLabel?: string;
  };
}

export default function PremierDeliveryEditor({ shop, initial }: Props) {
  const [form, setForm] = useState({
    regions: initial.regions.length ? initial.regions : [""],
    windows: initial.windows.length ? initial.windows : [""],
    carriers: initial.carriers?.length ? initial.carriers : [""],
    surcharge:
      initial.surcharge !== undefined ? String(initial.surcharge) : "",
    serviceLabel: initial.serviceLabel ?? "",
  });

  const { saving, errors, toast, closeToast, handleSubmit, setErrors } =
    useServiceEditorForm({
      submit: (formData) => updatePremierDelivery(shop, formData),
      successMessage: "Premier delivery updated.",
      errorMessage: "Fix the highlighted fields to save premier delivery.",
      onSuccess: (result) => {
        const delivery = result?.settings?.premierDelivery;
        if (delivery) {
          setForm({
            regions: delivery.regions.length ? delivery.regions : [""],
            windows: delivery.windows.length ? delivery.windows : [""],
            carriers: delivery.carriers?.length ? delivery.carriers : [""],
            surcharge:
              delivery.surcharge !== undefined
                ? String(delivery.surcharge)
                : "",
            serviceLabel: delivery.serviceLabel ?? "",
          });
        }
      },
    });

  const updateCollection = (
    key: "regions" | "windows" | "carriers",
    index: number,
    value: string,
  ) => {
    setForm((previous) => {
      const nextValues = [...previous[key]];
      nextValues[index] = value;
      return { ...previous, [key]: nextValues };
    });
    if (errors[key]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });
    }
  };

  const addCollectionItem = (key: "regions" | "windows" | "carriers") => {
    setForm((previous) => ({ ...previous, [key]: [...previous[key], ""] }));
  };

  const removeCollectionItem = (key: "regions" | "windows" | "carriers", index: number) => {
    setForm((previous) => ({
      ...previous,
      [key]: previous[key].filter((_, i) => i !== index),
    }));
  };

  const updateField = (field: "serviceLabel" | "surcharge", value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
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
      <Card className="max-w-3xl">
        <CardContent className="space-y-6 p-6">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <CollectionField
              label="Regions"
              name="regions"
              values={form.regions}
              onChange={(index, value) => updateCollection("regions", index, value)}
              onAdd={() => addCollectionItem("regions")}
              onRemove={(index) => removeCollectionItem("regions", index)}
              placeholder="Manhattan"
              description="Supported delivery regions. Leave blank to remove a region."
              addLabel="Add region"
              error={errors.regions}
            />
            <CollectionField
              label="One-hour windows"
              name="windows"
              values={form.windows}
              onChange={(index, value) => updateCollection("windows", index, value)}
              onAdd={() => addCollectionItem("windows")}
              onRemove={(index) => removeCollectionItem("windows", index)}
              placeholder="09-10"
              description="Enter windows using HH-HH format."
              addLabel="Add window"
              error={errors.windows}
            />
            <CollectionField
              label="Preferred carriers"
              name="carriers"
              values={form.carriers}
              onChange={(index, value) => updateCollection("carriers", index, value)}
              onAdd={() => addCollectionItem("carriers")}
              onRemove={(index) => removeCollectionItem("carriers", index)}
              placeholder="Acme Luxury"
              description="Optional carrier overrides for the premier route."
              addLabel="Add carrier"
              error={errors.carriers}
            />
            <FormField
              label="Service label"
              htmlFor="premier-service-label"
              error={<ErrorChip error={errors.serviceLabel} />}
            >
              <Input
                id="premier-service-label"
                name="serviceLabel"
                value={form.serviceLabel}
                onChange={(event) => updateField("serviceLabel", event.target.value)}
                placeholder="Premiere courier"
              />
              <p className="text-xs text-muted-foreground">
                Optional marketing copy shown at checkout.
              </p>
            </FormField>
            <FormField
              label="Surcharge"
              htmlFor="premier-surcharge"
              error={<ErrorChip error={errors.surcharge} />}
            >
              <Input
                id="premier-surcharge"
                name="surcharge"
                type="number"
                inputMode="numeric"
                min={0}
                value={form.surcharge}
                onChange={(event) => updateField("surcharge", event.target.value)}
                placeholder="25"
              />
              <p className="text-xs text-muted-foreground">
                Optional surcharge applied to the premier service. Leave blank for no surcharge.
              </p>
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save premier delivery"}
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
