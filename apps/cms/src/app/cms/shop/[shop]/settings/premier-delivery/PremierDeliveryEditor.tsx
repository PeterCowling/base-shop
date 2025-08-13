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

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <label className="flex flex-col gap-1">
        <span>Regions (comma separated)</span>
        <Input name="regions" defaultValue={initial.regions.join(", ")} />
        {errors.regions && (
          <span className="text-sm text-red-600">{errors.regions.join("; ")}</span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Windows (comma separated)</span>
        <Input name="windows" defaultValue={initial.windows.join(", ")} />
        {errors.windows && (
          <span className="text-sm text-red-600">{errors.windows.join("; ")}</span>
        )}
      </label>
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
