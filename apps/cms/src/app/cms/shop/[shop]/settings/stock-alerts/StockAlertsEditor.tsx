"use client";

import { useCallback, useState, type FormEvent } from "react";

import { Toast } from "@/components/atoms";
import { Button, Card, CardContent, Input, Textarea } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import { updateStockAlert } from "@cms/actions/shops.server";
import { parseStockAlertForm } from "@cms/services/shops/validation";

import { ErrorChips } from "../components/ErrorChips";
import { useSettingsSaveForm } from "../hooks/useSettingsSaveForm";

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

  const {
    saving,
    errors,
    setErrors,
    submit,
    toast,
    toastClassName,
    closeToast,
    announceError,
  } = useSettingsSaveForm<StockAlertResult>({
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

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const { data, errors: validationErrors } = parseStockAlertForm(formData);

      if (!data) {
        const fieldErrors = validationErrors ?? {};
        setErrors(fieldErrors);

        const message = fieldErrors.recipients?.length
          ? "Enter valid recipient email addresses separated by commas."
          : fieldErrors.threshold?.length
            ? "Enter a default threshold of at least 1."
            : "Please fix the errors before saving.";

        announceError(message);
        return;
      }

      setErrors({});

      const normalizedFormData = new FormData();
      data.recipients.forEach((recipient) => {
        normalizedFormData.append("recipients", recipient);
      });
      if (data.webhook) {
        normalizedFormData.set("webhook", data.webhook);
      }
      if (typeof data.threshold === "number") {
        normalizedFormData.set("threshold", data.threshold.toString());
      }

      await submit(normalizedFormData);
    },
    [announceError, setErrors, submit],
  );

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
