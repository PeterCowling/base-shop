"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import { updatePremierDelivery } from "@cms/actions/shops.server";
import { useState, type ChangeEvent, type FormEvent } from "react";

interface Props {
  shop: string;
  initial: { regions: string[]; windows: string[] };
}

export default function DeliveryEditor({ shop, initial }: Props) {
  const [state, setState] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState((s) => ({ ...s, [name]: value.split(/,\s*/).filter(Boolean) }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const result = await updatePremierDelivery(shop, fd);
    if (result.errors) {
      setErrors(result.errors);
    } else if (result.settings?.premierDelivery) {
      setState(result.settings.premierDelivery);
      setErrors({});
    }
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <label className="flex flex-col gap-1">
        <span>Regions (comma separated)</span>
        <Input
          name="regions"
          value={state.regions.join(",")}
          onChange={handleChange}
        />
        {errors.regions && (
          <span className="text-sm text-red-600">
            {errors.regions.join("; ")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Windows (comma separated)</span>
        <Input
          name="windows"
          value={state.windows.join(",")}
          onChange={handleChange}
        />
        {errors.windows && (
          <span className="text-sm text-red-600">
            {errors.windows.join("; ")}
          </span>
        )}
      </label>
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
