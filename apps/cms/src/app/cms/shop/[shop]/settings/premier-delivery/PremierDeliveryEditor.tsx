"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import { updatePremierDelivery } from "@cms/actions/shops.server";
import { FormEvent, useState } from "react";

interface Props {
  shop: string;
  initial: { regions: string[]; windows: string[] };
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
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
