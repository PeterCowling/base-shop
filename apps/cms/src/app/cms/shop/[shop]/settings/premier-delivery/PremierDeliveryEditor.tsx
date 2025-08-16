"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import { updatePremierDelivery } from "@cms/actions/shops.server";
import { FormEvent, useState } from "react";

interface Props {
  shop: string;
  initial: {
    regions: string[];
    windows: string[];
    carriers: string[];
    surcharge?: number;
    serviceLabel?: string;
  };
}

export default function PremierDeliveryEditor({ shop, initial }: Props) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [regions, setRegions] = useState<string[]>(
    initial.regions.length ? initial.regions : [""]
  );
  const [windows, setWindows] = useState<string[]>(
    initial.windows.length ? initial.windows : [""]
  );
  const [carriers, setCarriers] = useState<string[]>(
    initial.carriers.length ? initial.carriers : [""]
  );
  const [surcharge, setSurcharge] = useState(
    initial.surcharge ? String(initial.surcharge) : ""
  );
  const [serviceLabel, setServiceLabel] = useState(initial.serviceLabel ?? "");

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const result = await updatePremierDelivery(shop, fd);
    if (result.errors) {
      setErrors(result.errors);
    } else {
      setErrors({});
    }
    setSaving(false);
  };

  const updateRegion = (index: number, value: string) => {
    setRegions((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const updateWindow = (index: number, value: string) => {
    setWindows((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const addRegion = () => setRegions((prev) => [...prev, ""]);
  const removeRegion = (index: number) =>
    setRegions((prev) => prev.filter((_, i) => i !== index));

  const addWindow = () => setWindows((prev) => [...prev, ""]);
  const removeWindow = (index: number) =>
    setWindows((prev) => prev.filter((_, i) => i !== index));
  const updateCarrier = (index: number, value: string) => {
    setCarriers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };
  const addCarrier = () => setCarriers((prev) => [...prev, ""]);
  const removeCarrier = (index: number) =>
    setCarriers((prev) => prev.filter((_, i) => i !== index));

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium">Regions</legend>
        {regions.map((region, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              name="regions"
              value={region}
              onChange={(e) => updateRegion(i, e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => removeRegion(i)}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="ghost" onClick={addRegion}>
          Add region
        </Button>
        {errors.regions && (
          <span className="text-sm text-red-600">{errors.regions.join("; ")}</span>
        )}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium">One-hour Windows</legend>
        {windows.map((window, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              name="windows"
              value={window}
              onChange={(e) => updateWindow(i, e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => removeWindow(i)}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="ghost" onClick={addWindow}>
          Add window
        </Button>
        {errors.windows && (
          <span className="text-sm text-red-600">{errors.windows.join("; ")}</span>
        )}
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="font-medium">Carriers</legend>
        {carriers.map((carrier, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              name="carriers"
              value={carrier}
              onChange={(e) => updateCarrier(i, e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => removeCarrier(i)}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="ghost" onClick={addCarrier}>
          Add carrier
        </Button>
        {errors.carriers && (
          <span className="text-sm text-red-600">{errors.carriers.join("; ")}</span>
        )}
      </fieldset>
      <label className="flex flex-col gap-2">
        Surcharge
        <Input
          name="surcharge"
          value={surcharge}
          onChange={(e) => setSurcharge(e.target.value)}
        />
        {errors.surcharge && (
          <span className="text-sm text-red-600">{errors.surcharge.join("; ")}</span>
        )}
      </label>
      <label className="flex flex-col gap-2">
        Service Label
        <Input
          name="serviceLabel"
          value={serviceLabel}
          onChange={(e) => setServiceLabel(e.target.value)}
        />
        {errors.serviceLabel && (
          <span className="text-sm text-red-600">{errors.serviceLabel.join("; ")}</span>
        )}
      </label>
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
