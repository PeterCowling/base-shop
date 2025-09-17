"use client";

import {
  useCallback,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { Toast } from "@/components/atoms";
import { Button, Card, CardContent, Input, Textarea } from "@/components/atoms/shadcn";
import { FormField } from "@ui/components/molecules";
import { updateStockAlert } from "@cms/actions/shops.server";

import { ErrorChips } from "../components/ErrorChips";
import {
  useSettingsSaveForm,
  type ValidationErrors,
} from "../hooks/useSettingsSaveForm";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

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

  const clearFieldError = useCallback(
    (field: string) => {
      setErrors((current) => {
        if (!current[field]) {
          return current;
        }
        const next: ValidationErrors = { ...current };
        delete next[field];
        return next;
      });
    },
    [setErrors],
  );

  const handleRecipientsChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = event.target;
    setState((current) => ({ ...current, recipients: value }));
    clearFieldError("recipients");
  };

  const handleWebhookChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setState((current) => ({ ...current, webhook: value }));
    clearFieldError("webhook");
  };

  const handleThresholdChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setState((current) => ({ ...current, threshold: value }));
    clearFieldError("threshold");
  };

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const recipients = state.recipients
        .split(",")
        .map((recipient) => recipient.trim())
        .filter(Boolean);
      const webhook = state.webhook.trim();
      const thresholdValue = state.threshold.trim();

      const validationErrors: ValidationErrors = {};
      let toastMessage: string | undefined;

      if (recipients.length === 0) {
        validationErrors.recipients = ["Enter at least one recipient email."];
        toastMessage = "Enter at least one recipient email.";
      } else {
        const invalidRecipients = recipients.filter(
          (recipient) => !EMAIL_PATTERN.test(recipient),
        );
        if (invalidRecipients.length > 0) {
          validationErrors.recipients = invalidRecipients.map(
            (recipient) => `Invalid email: ${recipient}`,
          );
          toastMessage = "Enter valid recipient email addresses.";
        }
      }

      let thresholdNumber: number | undefined;
      if (thresholdValue !== "") {
        const parsedThreshold = Number(thresholdValue);
        if (!Number.isFinite(parsedThreshold) || !Number.isInteger(parsedThreshold)) {
          validationErrors.threshold = ["Enter a whole number threshold."];
          if (!toastMessage) {
            toastMessage = "Enter a whole number threshold.";
          }
        } else if (parsedThreshold < 1) {
          validationErrors.threshold = ["Enter a threshold of at least 1."];
          if (!toastMessage) {
            toastMessage = "Enter a threshold of at least 1.";
          }
        } else {
          thresholdNumber = parsedThreshold;
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        announceError(toastMessage ?? "Fix the validation errors and try again.");
        return;
      }

      const normalizedFormData = new FormData();
      normalizedFormData.set("recipients", recipients.join(","));
      if (webhook) {
        normalizedFormData.set("webhook", webhook);
      }
      if (thresholdNumber !== undefined) {
        normalizedFormData.set("threshold", String(thresholdNumber));
      }

      setErrors({});
      void submit(normalizedFormData);
    },
    [
      announceError,
      setErrors,
      state.recipients,
      state.threshold,
      state.webhook,
      submit,
    ],
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
                onChange={handleRecipientsChange}
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
                onChange={handleWebhookChange}
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
                onChange={handleThresholdChange}
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
