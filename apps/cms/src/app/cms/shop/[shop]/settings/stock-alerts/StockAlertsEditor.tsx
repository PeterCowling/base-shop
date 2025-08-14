"use client";

import { Button, Input, Textarea } from "@/components/atoms/shadcn";
import { updateStockAlerts } from "@cms/actions/shops.server";
import { useState, type FormEvent, type ChangeEvent } from "react";

interface Props {
  shop: string;
  initial: { recipients: string[]; webhook?: string; threshold?: number };
}

export default function StockAlertsEditor({ shop, initial }: Props) {
  const [state, setState] = useState({
    recipients: initial.recipients.join(", "),
    webhook: initial.webhook ?? "",
    threshold: initial.threshold?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
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
    } else if (result.config) {
      setState({
        recipients: result.config.recipients.join(", "),
        webhook: result.config.webhook ?? "",
        threshold: result.config.threshold?.toString() ?? "",
      });
      setErrors({});
    }
    setSaving(false);
  };

  return (
    <form onSubmit={onSubmit} className="grid max-w-md gap-4">
      <label className="flex flex-col gap-1">
        <span>Recipients (comma or newline separated)</span>
        <Textarea
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
        <Input name="webhook" value={state.webhook} onChange={handleChange} />
        {errors.webhook && (
          <span className="text-sm text-red-600">
            {errors.webhook.join("; ")}
          </span>
        )}
      </label>
      <label className="flex flex-col gap-1">
        <span>Default Threshold</span>
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
