"use client";

import { Button, Input } from "@/components/atoms/shadcn";
import { updateStockAlerts } from "@cms/actions/shops.server";
import { useState, type ChangeEvent, type FormEvent } from "react";

interface Props {
  shop: string;
  initial: { recipients: string; webhook: string; threshold: number };
}

export default function StockAlertsEditor({ shop, initial }: Props) {
  const [state, setState] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState((s) => ({ ...s, [name]: value }));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const result = await updateStockAlerts(shop, fd);
    if (result.errors) {
      setErrors(result.errors);
    } else if (result.settings?.stockAlert) {
      setState({
        recipients: result.settings.stockAlert.recipients.join(", "),
        webhook: result.settings.stockAlert.webhook ?? "",
        threshold: result.settings.stockAlert.threshold ?? 0,
      });
      setErrors({});
    }
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <label className="flex flex-col gap-1">
        <span>Recipients (comma separated)</span>
        <Input
          type="text"
          name="recipients"
          value={state.recipients}
          onChange={handleChange}
        />
        {errors.recipients && (
          <span className="text-sm text-red-600">
            {errors.recipients.join("; ")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Webhook URL</span>
        <Input
          type="url"
          name="webhook"
          value={state.webhook}
          onChange={handleChange}
        />
        {errors.webhook && (
          <span className="text-sm text-red-600">
            {errors.webhook.join("; ")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Threshold</span>
        <Input
          type="number"
          name="threshold"
          value={state.threshold}
          onChange={handleChange}
        />
        {errors.threshold && (
          <span className="text-sm text-red-600">
            {errors.threshold.join("; ")}
          </span>
        )}
      </label>
      <Button className="bg-primary text-white" disabled={saving} type="submit">
        {saving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

