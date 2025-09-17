"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "../../../atoms/shadcn";
import { Toast } from "../../../atoms";
import { cn } from "../../../../utils/style";
import {
  defaultDiscountValues,
  getDiscountPreview,
  type DiscountFormValues,
  type DiscountPreviewData,
  type DiscountType,
} from "./types";
import {
  type AsyncSubmissionHandler,
  type SubmissionStatus,
  type ValidationErrors,
} from "../shared";

type DiscountField = keyof DiscountFormValues;
type DiscountErrors = ValidationErrors<DiscountField>;

export interface DiscountFormProps {
  defaultValues?: Partial<DiscountFormValues>;
  validationErrors?: DiscountErrors;
  onSubmit?: AsyncSubmissionHandler<DiscountFormValues>;
  onPreviewChange?: (preview: DiscountPreviewData) => void;
  onStatusChange?: (status: SubmissionStatus) => void;
  submitLabel?: string;
  className?: string;
  busy?: boolean;
}

function validate(values: DiscountFormValues): DiscountErrors {
  const errors: DiscountErrors = {};
  if (!values.code) errors.code = "Promo code is required.";
  if (values.value <= 0) errors.value = "Discount must be greater than zero.";
  if (values.minPurchase < 0)
    errors.minPurchase = "Minimum purchase cannot be negative.";
  if (!values.startDate) errors.startDate = "Start date required.";
  if (values.endDate && values.startDate && values.endDate < values.startDate) {
    errors.endDate = "End date must be after start date.";
  }
  if (!values.appliesTo) errors.appliesTo = "Describe the scope of the discount.";
  return errors;
}

export function DiscountForm({
  defaultValues,
  validationErrors,
  onSubmit,
  onPreviewChange,
  onStatusChange,
  submitLabel = "Save discount",
  className,
  busy,
}: DiscountFormProps) {
  const [values, setValues] = useState<DiscountFormValues>({
    ...defaultDiscountValues,
    ...defaultValues,
  });
  const [internalErrors, setInternalErrors] = useState<DiscountErrors>({});
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [toast, setToast] = useState<{ open: boolean; message: string }>(
    { open: false, message: "" }
  );

  useEffect(() => {
    setValues({ ...defaultDiscountValues, ...defaultValues });
  }, [defaultValues]);

  useEffect(() => {
    onPreviewChange?.(getDiscountPreview(values));
  }, [values, onPreviewChange]);

  const errors = useMemo(
    () => ({ ...internalErrors, ...(validationErrors ?? {}) }),
    [internalErrors, validationErrors]
  );

  const update = <K extends DiscountField>(
    key: K,
    value: DiscountFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setInternalErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("validating");
    onStatusChange?.("validating");
    const nextErrors = validate(values);
    setInternalErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");
      onStatusChange?.("error");
      setToast({
        open: true,
        message: "Resolve the highlighted issues before continuing.",
      });
      return;
    }

    if (!onSubmit) {
      setStatus("success");
      onStatusChange?.("success");
      setToast({ open: true, message: "Discount draft saved." });
      return;
    }

    try {
      setStatus("submitting");
      onStatusChange?.("submitting");
      await onSubmit(values);
      setStatus("success");
      onStatusChange?.("success");
      setToast({ open: true, message: "Discount saved." });
    } catch (error) {
      setStatus("error");
      onStatusChange?.("error");
      const fallback =
        error instanceof Error ? error.message : "Unable to save discount.";
      setToast({ open: true, message: fallback });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={cn("space-y-6", className)}
    >
      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="discount-code" className="text-sm font-medium">
              Code
            </label>
            <Input
              id="discount-code"
              value={values.code}
              onChange={(event) => update("code", event.target.value.toUpperCase())}
              aria-invalid={errors.code ? "true" : "false"}
              aria-describedby={errors.code ? "discount-code-error" : undefined}
            />
            {errors.code && (
              <p
                id="discount-code-error"
                className="text-danger text-xs"
                data-token="--color-danger"
              >
                {errors.code}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Discount type</label>
            <Select
              value={values.type}
              onValueChange={(value) => update("type", value as DiscountType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="fixed">Fixed amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="discount-value" className="text-sm font-medium">
              Value
            </label>
            <Input
              id="discount-value"
              type="number"
              min={1}
              value={String(values.value)}
              onChange={(event) =>
                update("value", Number(event.target.value || 0))
              }
              aria-invalid={errors.value ? "true" : "false"}
              aria-describedby={errors.value ? "discount-value-error" : undefined}
            />
            {errors.value && (
              <p
                id="discount-value-error"
                className="text-danger text-xs"
                data-token="--color-danger"
              >
                {errors.value}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label
              htmlFor="discount-min-purchase"
              className="text-sm font-medium"
            >
              Minimum purchase
            </label>
            <Input
              id="discount-min-purchase"
              type="number"
              min={0}
              value={String(values.minPurchase)}
              onChange={(event) =>
                update("minPurchase", Number(event.target.value || 0))
              }
              aria-invalid={errors.minPurchase ? "true" : "false"}
              aria-describedby={
                errors.minPurchase ? "discount-min-error" : undefined
              }
            />
            {errors.minPurchase && (
              <p
                id="discount-min-error"
                className="text-danger text-xs"
                data-token="--color-danger"
              >
                {errors.minPurchase}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="discount-start" className="text-sm font-medium">
              Start date
            </label>
            <Input
              id="discount-start"
              type="date"
              value={values.startDate}
              onChange={(event) => update("startDate", event.target.value)}
              aria-invalid={errors.startDate ? "true" : "false"}
              aria-describedby={errors.startDate ? "discount-start-error" : undefined}
            />
            {errors.startDate && (
              <p
                id="discount-start-error"
                className="text-danger text-xs"
                data-token="--color-danger"
              >
                {errors.startDate}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="discount-end" className="text-sm font-medium">
              End date
            </label>
            <Input
              id="discount-end"
              type="date"
              value={values.endDate}
              onChange={(event) => update("endDate", event.target.value)}
              aria-invalid={errors.endDate ? "true" : "false"}
              aria-describedby={errors.endDate ? "discount-end-error" : undefined}
            />
            {errors.endDate && (
              <p
                id="discount-end-error"
                className="text-danger text-xs"
                data-token="--color-danger"
              >
                {errors.endDate}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label htmlFor="discount-usage" className="text-sm font-medium">
              Usage limit
            </label>
            <Input
              id="discount-usage"
              type="number"
              min={0}
              value={String(values.usageLimit)}
              onChange={(event) =>
                update("usageLimit", Number(event.target.value || 0))
              }
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <label htmlFor="discount-applies" className="text-sm font-medium">
              Applies to
            </label>
            <Textarea
              id="discount-applies"
              rows={2}
              value={values.appliesTo}
              onChange={(event) => update("appliesTo", event.target.value)}
              aria-invalid={errors.appliesTo ? "true" : "false"}
              aria-describedby={
                errors.appliesTo ? "discount-applies-error" : undefined
              }
            />
            {errors.appliesTo && (
              <p
                id="discount-applies-error"
                className="text-danger text-xs"
                data-token="--color-danger"
              >
                {errors.appliesTo}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={busy || status === "submitting"}>
          {status === "submitting" ? "Saving…" : submitLabel}
        </Button>
      </div>

      <Toast
        open={toast.open}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </form>
  );
}

export default DiscountForm;
