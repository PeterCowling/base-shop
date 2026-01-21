"use client";
import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { updateCurrencyAndTax } from "@cms/actions/shops.server";

import { Button, Input } from "@acme/ui/components/atoms/shadcn";

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
      setState({
        currency: result.settings.currency ?? state.currency,
        taxRegion: result.settings.taxRegion ?? state.taxRegion,
      });
      setErrors({});
    }
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <label className="flex flex-col gap-1">
        <span>Currency</span>
        <Input
          name="currency"
          value={state.currency}
          onChange={handleChange}
          aria-invalid={errors.currency ? true : undefined}
        />
        {errors.currency && (
          <span role="alert" className="text-sm text-danger-foreground">
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
          aria-invalid={errors.taxRegion ? true : undefined}
        />
        {errors.taxRegion && (
          <span role="alert" className="text-sm text-danger-foreground">
            {errors.taxRegion.join("; ")}
          </span>
        )}
      </label>
      <Button className="bg-primary text-primary-foreground" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
