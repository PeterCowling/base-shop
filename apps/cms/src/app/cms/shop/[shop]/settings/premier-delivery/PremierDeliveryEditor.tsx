"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";

import { Toast } from "@/components/atoms";
import { Button, Card, CardContent, Input } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import { updatePremierDelivery } from "@cms/actions/shops.server";

import { ErrorChips } from "../components/ErrorChips";
import { StringCollectionField } from "../components/StringCollectionField";
import { useSettingsSaveForm } from "../hooks/useSettingsSaveForm";

type PremierDeliveryState = {
  serviceLabel: string;
  surcharge: string;
  regions: string[];
  windows: string[];
  carriers: string[];
};

type PremierDeliveryResult = Awaited<ReturnType<typeof updatePremierDelivery>>;

type CollectionKey = "regions" | "windows" | "carriers";

const ensureCollection = (values: string[]) =>
  values.length > 0 ? values : [""];

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
  const [state, setState] = useState<PremierDeliveryState>(() => ({
    serviceLabel: initial.serviceLabel ?? "",
    surcharge:
      initial.surcharge === undefined || initial.surcharge === null
        ? ""
        : String(initial.surcharge),
    regions: ensureCollection(initial.regions ?? []),
    windows: ensureCollection(initial.windows ?? []),
    carriers: ensureCollection(initial.carriers ?? []),
  }));

  const {
    saving,
    errors,
    submit,
    toast,
    toastClassName,
    dismissToast,
  } = useSettingsSaveForm<PremierDeliveryResult>({
    action: (formData) => updatePremierDelivery(shop, formData),
    successMessage: "Premier delivery settings saved.",
    errorMessage: "Unable to update premier delivery settings.",
    onSuccess: (result) => {
      const next = result.settings?.premierDelivery;
      if (!next) return;
      setState({
        serviceLabel: next.serviceLabel ?? "",
        surcharge:
          next.surcharge === undefined || next.surcharge === null
            ? ""
            : String(next.surcharge),
        regions: ensureCollection(next.regions ?? []),
        windows: ensureCollection(next.windows ?? []),
        carriers: ensureCollection(next.carriers ?? []),
      });
    },
  });

  const updateCollection = (key: CollectionKey, index: number, value: string) => {
    setState((current) => {
      const nextValues = [...current[key]];
      nextValues[index] = value;
      return { ...current, [key]: nextValues };
    });
  };

  const addCollectionValue = (key: CollectionKey) => {
    setState((current) => ({
      ...current,
      [key]: [...current[key], ""],
    }));
  };

  const removeCollectionValue = (key: CollectionKey, index: number) => {
    setState((current) => {
      const nextValues = current[key].filter((_, idx) => idx !== index);
      return { ...current, [key]: ensureCollection(nextValues) };
    });
  };

  const regionErrors = useMemo(() => errors.regions, [errors.regions]);
  const windowErrors = useMemo(() => errors.windows, [errors.windows]);
  const carrierErrors = useMemo(() => errors.carriers, [errors.carriers]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const formData = new FormData();
      const serviceLabel = state.serviceLabel.trim();
      const surcharge = state.surcharge.trim();

      formData.set("serviceLabel", serviceLabel);
      formData.set("surcharge", surcharge === "" ? "" : surcharge);

      const trimmedRegions = state.regions
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      const trimmedWindows = state.windows
        .map((value) => value.trim())
        .filter((value) => value.length > 0);
      const trimmedCarriers = state.carriers
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

      trimmedRegions.forEach((value) => formData.append("regions", value));
      trimmedWindows.forEach((value) => formData.append("windows", value));
      trimmedCarriers.forEach((value) => formData.append("carriers", value));

      return submit(formData);
    },
    [state, submit],
  );

  return (
    <>
      <Card className="border border-border/60">
        <CardContent className="space-y-6 p-6">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                label="Service label"
                htmlFor="premier-service-label"
                error={<ErrorChips errors={errors.serviceLabel} />}
                className="gap-3"
              >
                <Input
                  id="premier-service-label"
                  name="serviceLabel"
                  value={state.serviceLabel}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      serviceLabel: event.target.value,
                    }))
                  }
                  placeholder="Premier Delivery"
                  autoComplete="off"
                />
              </FormField>
              <FormField
                label="Surcharge"
                htmlFor="premier-surcharge"
                error={<ErrorChips errors={errors.surcharge} />}
                className="gap-3"
              >
                <Input
                  id="premier-surcharge"
                  name="surcharge"
                  type="number"
                  min="0"
                  value={state.surcharge}
                  onChange={(event) =>
                    setState((current) => ({
                      ...current,
                      surcharge: event.target.value,
                    }))
                  }
                  placeholder="0"
                />
              </FormField>
            </div>

            <StringCollectionField
              idPrefix="premier-region"
              name="regions"
              label="Regions"
              values={state.regions}
              onChange={(index, value) => updateCollection("regions", index, value)}
              onAdd={() => addCollectionValue("regions")}
              onRemove={(index) => removeCollectionValue("regions", index)}
              placeholder="New York"
              addLabel="Add region"
              description="List the regions where one-hour delivery is available."
              errors={regionErrors}
              emptyState="No regions configured."
            />

            <StringCollectionField
              idPrefix="premier-window"
              name="windows"
              label="One-hour windows"
              values={state.windows}
              onChange={(index, value) => updateCollection("windows", index, value)}
              onAdd={() => addCollectionValue("windows")}
              onRemove={(index) => removeCollectionValue("windows", index)}
              placeholder="08-10"
              addLabel="Add window"
              description="Use 24-hour HH-HH format (for example, 08-10)."
              errors={windowErrors}
              emptyState="No delivery windows configured."
            />

            <StringCollectionField
              idPrefix="premier-carrier"
              name="carriers"
              label="Preferred carriers"
              values={state.carriers}
              onChange={(index, value) => updateCollection("carriers", index, value)}
              onAdd={() => addCollectionValue("carriers")}
              onRemove={(index) => removeCollectionValue("carriers", index)}
              placeholder="Acme Express"
              addLabel="Add carrier"
              description="Specify any priority carriers that support this service."
              errors={carrierErrors}
              emptyState="No carriers listed."
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
        onClose={dismissToast}
        className={toastClassName}
        role="status"
      />
    </>
  );
}
