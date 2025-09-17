"use client";

import { useState, type ChangeEvent } from "react";
import { Toast } from "@/components/atoms";
import { Button, Card, CardContent, Input } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import { updateStockAlert } from "@cms/actions/shops.server";

import { ErrorChip } from "../components/ErrorChip";
import { toastStyles, useServiceEditorForm } from "../hooks/useServiceEditorForm";

interface Props {
  shop: string;
  initial: { recipients: string[]; webhook?: string; threshold?: number };
}

export default function StockAlertsEditor({ shop, initial }: Props) {
  const [form, setForm] = useState({
    recipients: initial.recipients.join(", "),
    webhook: initial.webhook ?? "",
    threshold: initial.threshold ? String(initial.threshold) : "",
  });

  const { saving, errors, toast, closeToast, handleSubmit, setErrors } =
    useServiceEditorForm({
      submit: (formData) => updateStockAlert(shop, formData),
      successMessage: "Stock alerts updated.",
      errorMessage: "Fix the highlighted fields to save stock alerts.",
      onSuccess: (result) => {
        const alert = result?.settings?.stockAlert;
        if (alert) {
          setForm({
            recipients: alert.recipients.join(", "),
            webhook: alert.webhook ?? "",
            threshold: alert.threshold ? String(alert.threshold) : "",
          });
        }
      },
    });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    if (errors[name]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  };

  return (
    <>
      <Card className="max-w-xl">
        <CardContent className="space-y-6 p-6">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <FormField
              label="Recipients"
              htmlFor="stock-alert-recipients"
              error={<ErrorChip error={errors.recipients} />}
            >
              <Input
                id="stock-alert-recipients"
                name="recipients"
                value={form.recipients}
                onChange={handleChange}
                placeholder="alerts@example.com, ops@example.com"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Use comma separation to notify multiple inboxes.
              </p>
            </FormField>
            <FormField
              label="Webhook URL"
              htmlFor="stock-alert-webhook"
              error={<ErrorChip error={errors.webhook} />}
            >
              <Input
                id="stock-alert-webhook"
                name="webhook"
                value={form.webhook}
                onChange={handleChange}
                placeholder="https://hooks.example.com/stock"
              />
              <p className="text-xs text-muted-foreground">
                Optional callback invoked in tandem with emails. Leave blank to skip webhooks.
              </p>
            </FormField>
            <FormField
              label="Default threshold"
              htmlFor="stock-alert-threshold"
              error={<ErrorChip error={errors.threshold} />}
            >
              <Input
                id="stock-alert-threshold"
                name="threshold"
                type="number"
                inputMode="numeric"
                min={1}
                value={form.threshold}
                onChange={handleChange}
                placeholder="5"
              />
              <p className="text-xs text-muted-foreground">
                Alert when stock falls below this quantity. Leave empty to disable default alerts.
              </p>
            </FormField>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save stock alerts"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Toast
        open={toast.open}
        message={toast.message}
        className={toastStyles[toast.status]}
        onClose={closeToast}
      />
    </>
  );
}

