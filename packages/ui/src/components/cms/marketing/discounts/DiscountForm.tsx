"use client";

import { useTranslations } from "@acme/i18n";

import { cn } from "../../../../utils/style";
import { Toast } from "../../../atoms";
import { Button } from "../../../atoms/shadcn";
import {
  type AsyncSubmissionHandler,
  type SubmissionStatus,
} from "../shared";

import {
  DiscountConfigurationCard,
  DiscountScheduleCard,
} from "./DiscountFieldGroups";
import {
  type DiscountErrors,
  useDiscountFormState,
} from "./hooks/useDiscountFormState";
import {
  type DiscountFormValues,
  type DiscountPreviewData,
} from "./types";

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

export function DiscountForm({
  defaultValues,
  validationErrors,
  onSubmit,
  onPreviewChange,
  onStatusChange,
  submitLabel,
  className,
  busy,
}: DiscountFormProps) {
  const t = useTranslations();
  const { values, errors, status, toast, update, handleSubmit, dismissToast } =
    useDiscountFormState({
      defaultValues,
      validationErrors,
      onSubmit,
      onPreviewChange,
      onStatusChange,
    });

  return (
    <form onSubmit={handleSubmit} noValidate className={cn("space-y-6", className)}>
      <DiscountConfigurationCard
        values={values}
        errors={errors}
        onChange={update}
      />
      <DiscountScheduleCard values={values} errors={errors} onChange={update} />
      <div className="flex justify-end">
        <Button type="submit" disabled={busy || status === "submitting"}>
          {status === "submitting" ? t("Saving…") : submitLabel ?? t("Save discount")}
        </Button>
      </div>
      <Toast open={toast.open} message={toast.message} onClose={dismissToast} />
    </form>
  );
}

export default DiscountForm;
