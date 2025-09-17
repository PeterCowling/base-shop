"use client";

import { useState } from "react";

import { Toast } from "@/components/atoms";
import { Button, Card, CardContent, Input, Textarea } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import { updateStockAlert } from "@cms/actions/shops.server";

import { ErrorChips } from "../components/ErrorChips";
import { useServiceEditorForm } from "../hooks/useServiceEditorForm";

type StockAlertState = {
  recipients: string;
  webhook: string;
  threshold: string;
};

type StockAlertResult = Awaited<ReturnType<typeof updateStockAlert>>;

interface Props {
  shop: string;
  initial: { recipients: string[]; webhook?: string; threshold?: number };
}

export default function StockAlertsEditor({ shop, initial }: Props) {
  const [state, setState] = useState<StockAlertState>({
    recipients: initial.recipients.join(", "),
    webhook: initial.webhook ?? "",
    threshold: initial.threshold === undefined ? "" : String(initial.threshold),
  });

  const { saving, errors, handleSubmit, toast, toastClassName, closeToast } =
    useServiceEditorForm<StockAlertResult>({
      action: (formData) => updateStockAlert(shop, formData),
      successMessage: "Stock alert settings saved.",
      errorMessage: "Unable to update stock alerts.",
      onSuccess: (result) => {
        const next = result.settings?.stockAlert;
        if (!next) return;
        setState({
          recipients: next.recipients.join(", "),
          webhook: next.webhook ?? "",
          threshold:
            next.threshold === undefined || next.threshold === null
              ? ""
              : String(next.threshold),
        });
      },
    });

  return (
    <>
      <Card className="border border-border/60">
        <CardContent className="space-y-6 p-6">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <FormField
              label="Recipients"
              htmlFor="stock-alert-recipients"
              error={<ErrorChips errors={errors.recipients} />}
              className="gap-3"
            >
              <Textarea
                id="stock-alert-recipients"
                name="recipients"
                rows={3}
                value={state.recipients}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    recipients: event.target.value,
                  }))
                }
                placeholder="name@example.com, ops@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple email addresses with commas.
              </p>
            </FormField>

            <FormField
              label="Webhook URL"
              htmlFor="stock-alert-webhook"
              error={<ErrorChips errors={errors.webhook} />}
              className="gap-3"
            >
              <Input
                id="stock-alert-webhook"
                name="webhook"
                value={state.webhook}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    webhook: event.target.value,
                  }))
                }
                placeholder="https://example.com/alerts"
                autoComplete="off"
              />
            </FormField>

            <FormField
              label="Default threshold"
              htmlFor="stock-alert-threshold"
              error={<ErrorChips errors={errors.threshold} />}
              className="gap-3"
            >
              <Input
                id="stock-alert-threshold"
                name="threshold"
                type="number"
                min="0"
                value={state.threshold}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    threshold: event.target.value,
                  }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Alert when on-hand quantity falls at or below this amount.
              </p>
            </FormField>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="h-10 px-6 text-sm font-semibold"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      <Toast
        open={toast.open}
        message={toast.message}
        onClose={closeToast}
        className={toastClassName}
        role="status"
      />
    </>
  );
}
