"use client";

import { Button, Checkbox, Input } from "@ui/components/atoms/shadcn";
import { updateLateFee } from "@cms/actions/shops.server";
import { useState, type ChangeEvent, type FormEvent } from "react";

interface Props {
  shop: string;
  initial: { enabled: boolean; intervalMinutes: number };
}

export default function LateFeesEditor({ shop, initial }: Props) {
  const [state, setState] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState((s) => ({ ...s, [name]: Number(value) }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    if (state.enabled) {
      fd.set("enabled", "on");
    }
    fd.set("intervalMinutes", String(state.intervalMinutes));
    const result = await updateLateFee(shop, fd);
    if (result.errors) {
      setErrors(result.errors);
    } else if (result.settings?.lateFeeService) {
      setState(result.settings.lateFeeService);
      setErrors({});
    }
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <label className="flex items-center gap-2">
        <Checkbox
          name="enabled"
          checked={state.enabled}
          onCheckedChange={(v: boolean) =>
            setState((s) => ({ ...s, enabled: Boolean(v) }))
          }
        />
        <span>Enable late fee service</span>
      </label>
      <label className="flex flex-col gap-1">
        <span>Interval (minutes)</span>
        <Input
          type="number"
          name="intervalMinutes"
          value={state.intervalMinutes}
          onChange={handleChange}
        />
        {errors.intervalMinutes && (
          <span className="text-sm text-red-600">
            {errors.intervalMinutes.join("; ")}
          </span>
        )}
      </label>
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
