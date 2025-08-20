"use client";
import { Button, Input } from "@ui/components/atoms/shadcn";
import { updateCurrencyAndTax } from "@cms/actions/shops.server";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

interface Props {
  shop: string;
  initial: { currency: string; taxRegion: string };
}

export default function CurrencyTaxEditor({ shop, initial }: Props) {
  const [state, setState] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setState((s) => ({ ...s, [name]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const result = await updateCurrencyAndTax(shop, fd);
    if (result.errors) {
      setErrors(result.errors);
    } else if (result.settings) {
      setState((s) => ({
        currency: result.settings.currency ?? s.currency,
        taxRegion: result.settings.taxRegion ?? s.taxRegion,
      }));
      setErrors({});
    }
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <label className="flex flex-col gap-1">
        <span>Currency</span>
        <Input
          name="currency"
          value={state.currency}
          onChange={handleChange}
        />
        {errors.currency && (
          <span className="text-sm text-red-600">
            {errors.currency.join("; ")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Tax Region</span>
        <Input
          name="taxRegion"
          value={state.taxRegion}
          onChange={handleChange}
        />
        {errors.taxRegion && (
          <span className="text-sm text-red-600">
            {errors.taxRegion.join("; ")}
          </span>
        )}
      </label>
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
