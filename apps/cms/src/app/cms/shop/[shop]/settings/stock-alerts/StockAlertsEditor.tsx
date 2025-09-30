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
import { useTranslations } from "@i18n/Translations";

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
  const t = useTranslations();
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
    successMessage: String(t("cms.stockAlerts.save.success")),
    errorMessage: String(t("cms.stockAlerts.save.error")),
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
        validationErrors.recipients = [
          String(t("cms.stockAlerts.validation.atLeastOneRecipient")),
        ];
        toastMessage = String(t("cms.stockAlerts.validation.atLeastOneRecipient"));
      } else {
        const invalidRecipients = recipients.filter(
          (recipient) => !EMAIL_PATTERN.test(recipient),
        );
        if (invalidRecipients.length > 0) {
          validationErrors.recipients = invalidRecipients.map((recipient) =>
            String(t("cms.stockAlerts.validation.invalidEmail", { recipient })),
          );
          toastMessage = String(
            t("cms.stockAlerts.validation.enterValidRecipientEmails"),
          );
        }
      }

      let thresholdNumber: number | undefined;
      if (thresholdValue !== "") {
        const parsedThreshold = Number(thresholdValue);
        if (!Number.isFinite(parsedThreshold) || !Number.isInteger(parsedThreshold)) {
          validationErrors.threshold = [
            String(t("cms.stockAlerts.validation.wholeNumberThreshold")),
          ];
          if (!toastMessage) {
            toastMessage = String(
              t("cms.stockAlerts.validation.wholeNumberThreshold"),
            );
          }
        } else if (parsedThreshold < 1) {
          validationErrors.threshold = [
            String(t("cms.stockAlerts.validation.minThreshold")),
          ];
          if (!toastMessage) {
            toastMessage = String(t("cms.stockAlerts.validation.minThreshold"));
          }
        } else {
          thresholdNumber = parsedThreshold;
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        announceError(
          toastMessage ?? String(t("cms.stockAlerts.validation.fixAndRetry")),
        );
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
      t,
    ],
  );

  return (
    <>
      <Card className="border border-border-3">
        <CardContent className="space-y-6 p-6">
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            <FormField
              label={String(t("cms.stockAlerts.recipients.label"))}
              htmlFor="stock-alert-recipients" // i18n-exempt -- CMS-0000 [ttl=2025-12-31] non-UI element id
              error={
                errors.recipients?.length ? (
                  <ErrorChips errors={errors.recipients} />
                ) : undefined
              }
              className="gap-3"
            >
              <Textarea
                id="stock-alert-recipients" // i18n-exempt -- CMS-0000 [ttl=2025-12-31] non-UI element id
                name="recipients"
                rows={3}
                value={state.recipients}
                onChange={handleRecipientsChange}
                placeholder={String(
                  t("cms.stockAlerts.recipients.placeholder"),
                )}
              />
              <p className="text-xs text-muted-foreground">
                {t("cms.stockAlerts.recipients.help")}
              </p>
            </FormField>

            <FormField
              label={String(t("cms.stockAlerts.webhook.label"))}
              htmlFor="stock-alert-webhook" // i18n-exempt -- CMS-0000 [ttl=2025-12-31] non-UI element id
              error={
                errors.webhook?.length ? (
                  <ErrorChips errors={errors.webhook} />
                ) : undefined
              }
              className="gap-3"
            >
              <Input
                id="stock-alert-webhook" // i18n-exempt -- CMS-0000 [ttl=2025-12-31] non-UI element id
                name="webhook"
                value={state.webhook}
                onChange={handleWebhookChange}
                placeholder={String(t("cms.stockAlerts.webhook.placeholder"))}
                autoComplete="off"
              />
            </FormField>

            <FormField
              label={String(t("cms.stockAlerts.threshold.label"))}
              htmlFor="stock-alert-threshold" // i18n-exempt -- CMS-0000 [ttl=2025-12-31] non-UI element id
              error={
                errors.threshold?.length ? (
                  <ErrorChips errors={errors.threshold} />
                ) : undefined
              }
              className="gap-3"
            >
              <Input
                id="stock-alert-threshold" // i18n-exempt -- CMS-0000 [ttl=2025-12-31] non-UI element id
                name="threshold"
                type="number"
                min="0"
                value={state.threshold}
                onChange={handleThresholdChange}
              />
              <p className="text-xs text-muted-foreground">
                {t("cms.stockAlerts.threshold.help")}
              </p>
            </FormField>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="h-10 px-6 text-sm font-semibold"
                disabled={saving}
              >
                {saving ? t("cms.common.saving") : t("cms.common.saveChanges")}
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
