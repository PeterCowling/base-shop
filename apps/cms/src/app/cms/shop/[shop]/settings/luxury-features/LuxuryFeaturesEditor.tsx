"use client";

import { Button, Checkbox, Input } from "@/components/atoms/shadcn";
import { updateLuxuryFeatures } from "@cms/actions/shops.server";
import { useState, type ChangeEvent, type FormEvent } from "react";

interface Props {
  shop: string;
  initial: { fraudReviewThreshold?: number; requireStrongCustomerAuth?: boolean };
}

export default function LuxuryFeaturesEditor({ shop, initial }: Props) {
  const [state, setState] = useState({
    fraudReviewThreshold: initial.fraudReviewThreshold ?? 0,
    requireStrongCustomerAuth: initial.requireStrongCustomerAuth ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState((s) => ({ ...s, [name]: Number(value) }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const result = await updateLuxuryFeatures(shop, fd);
    if (result.errors) {
      setErrors(result.errors);
    } else if (result.settings?.luxuryFeatures) {
      setState(result.settings.luxuryFeatures);
      setErrors({});
    }
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <label className="flex flex-col gap-1">
        <span>Fraud review threshold</span>
        <Input
          type="number"
          name="fraudReviewThreshold"
          value={state.fraudReviewThreshold}
          onChange={handleChange}
        />
        {errors.fraudReviewThreshold && (
          <span className="text-sm text-red-600">
            {errors.fraudReviewThreshold.join("; ")}
          </span>
        )}
      </label>
      <label className="flex items-center gap-2">
        <Checkbox
          name="requireStrongCustomerAuth"
          checked={state.requireStrongCustomerAuth}
          onCheckedChange={(v) =>
            setState((s) => ({ ...s, requireStrongCustomerAuth: Boolean(v) }))
          }
        />
        <span>Require strong customer authentication</span>
      </label>
      {errors.requireStrongCustomerAuth && (
        <span className="text-sm text-red-600">
          {errors.requireStrongCustomerAuth.join("; ")}
        </span>
      )}
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

