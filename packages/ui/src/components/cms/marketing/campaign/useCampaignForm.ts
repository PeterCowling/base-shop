import { useCallback, useEffect, useMemo, useState } from "react";

import {
  defaultCampaignValues,
  getCampaignPreview,
  type CampaignChannel,
  type CampaignFormSectionId,
  type CampaignFormValues,
} from "./types";
import {
  type AsyncSubmissionHandler,
  type SubmissionStatus,
  type ValidationErrors,
} from "../shared";

export interface CampaignFormMessages {
  success?: string;
  error?: string;
  validation?: string;
}

type CampaignField = keyof CampaignFormValues;

export type CampaignErrors = ValidationErrors<CampaignField>;

export interface CampaignFormToastState {
  open: boolean;
  message: string;
}

export type CampaignFormUpdater = <K extends CampaignField>(
  field: K,
  value: CampaignFormValues[K]
) => void;

const sectionFieldMap: Record<CampaignFormSectionId, CampaignField[]> = {
  basics: ["name", "objective", "description", "budget", "kpi"],
  audience: ["audience", "channels"],
  schedule: ["startDate", "endDate"],
};

function validateCampaign(
  values: CampaignFormValues,
  sections: CampaignFormSectionId[]
): CampaignErrors {
  const requiredFields = sections.flatMap((section) => sectionFieldMap[section]);
  const errors: CampaignErrors = {};

  for (const field of requiredFields) {
    const value = values[field];
    if (typeof value === "number") {
      if (Number.isNaN(value) || value < 0) {
        errors[field] = "Please provide a valid amount.";
      }
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        errors[field] = "Select at least one option.";
      }
    } else if (!value) {
      errors[field] = "This field is required.";
    }
  }

  if (
    requiredFields.includes("endDate") &&
    values.endDate &&
    values.startDate &&
    values.endDate < values.startDate
  ) {
    errors.endDate = "End date must be after the start date.";
  }

  return errors;
}

interface UseCampaignFormOptions {
  defaultValues?: Partial<CampaignFormValues>;
  sections: CampaignFormSectionId[];
  validationErrors?: CampaignErrors;
  onSubmit?: AsyncSubmissionHandler<CampaignFormValues>;
  onStatusChange?: (status: SubmissionStatus) => void;
  onPreviewChange?: (preview: ReturnType<typeof getCampaignPreview>) => void;
  status?: SubmissionStatus;
  messages?: CampaignFormMessages;
}

interface UseCampaignFormResult {
  values: CampaignFormValues;
  errors: CampaignErrors;
  status: SubmissionStatus;
  toast: CampaignFormToastState;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  updateValue: CampaignFormUpdater;
  toggleChannel: (channel: CampaignChannel) => void;
  dismissToast: () => void;
}

export function useCampaignForm({
  defaultValues,
  sections,
  validationErrors,
  onSubmit,
  onStatusChange,
  onPreviewChange,
  status: statusProp,
  messages,
}: UseCampaignFormOptions): UseCampaignFormResult {
  const [values, setValues] = useState<CampaignFormValues>({
    ...defaultCampaignValues,
    ...defaultValues,
  });
  const [internalErrors, setInternalErrors] = useState<CampaignErrors>({});
  const [internalStatus, setInternalStatus] =
    useState<SubmissionStatus>("idle");
  const [toast, setToast] = useState<CampaignFormToastState>({
    open: false,
    message: "",
  });
  const [dismissedServerErrors, setDismissedServerErrors] = useState<
    Set<CampaignField>
  >(new Set());

  const status = statusProp ?? internalStatus;

  useEffect(() => {
    setValues((prev) => ({ ...prev, ...defaultValues }));
  }, [defaultValues]);

  useEffect(() => {
    if (!onPreviewChange) return;
    onPreviewChange(getCampaignPreview(values));
  }, [values, onPreviewChange]);

  useEffect(() => {
    setDismissedServerErrors(new Set());
  }, [validationErrors]);

  const filteredValidationErrors = useMemo(() => {
    if (!validationErrors) {
      return {} as CampaignErrors;
    }

    const entries = Object.entries(validationErrors).filter(
      ([field]) => !dismissedServerErrors.has(field as CampaignField)
    );

    return Object.fromEntries(entries) as CampaignErrors;
  }, [validationErrors, dismissedServerErrors]);

  const errors = useMemo(
    () => ({
      ...internalErrors,
      ...filteredValidationErrors,
    }),
    [internalErrors, filteredValidationErrors]
  );

  const markStatus = useCallback(
    (next: SubmissionStatus) => {
      if (!statusProp) {
        setInternalStatus(next);
      }
      onStatusChange?.(next);
    },
    [onStatusChange, statusProp]
  );

  const showToast = useCallback((message: string) => {
    setToast({ open: true, message });
  }, []);

  const dismissToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      markStatus("validating");
      const nextErrors = validateCampaign(values, sections);
      setInternalErrors(nextErrors);

      if (Object.keys(nextErrors).length > 0) {
        markStatus("error");
        showToast(
          messages?.validation ?? "Please review the highlighted fields."
        );
        return;
      }

      if (!onSubmit) {
        markStatus("success");
        showToast(messages?.success ?? "Campaign draft saved locally.");
        return;
      }

      try {
        markStatus("submitting");
        await onSubmit(values);
        markStatus("success");
        showToast(messages?.success ?? "Campaign saved successfully.");
      } catch (error) {
        markStatus("error");
        const fallback =
          error instanceof Error
            ? error.message
            : messages?.error ?? "Failed to save campaign.";
        showToast(messages?.error ?? fallback);
      }
    },
    [markStatus, messages, onSubmit, sections, showToast, values]
  );

  const dismissServerError = useCallback((field: CampaignField) => {
    setDismissedServerErrors((prev) => {
      if (prev.has(field)) return prev;
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  }, []);

  const updateValue: CampaignFormUpdater = useCallback(
    (field, value) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      setInternalErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
      dismissServerError(field);
    },
    [dismissServerError]
  );

  const toggleChannel = useCallback(
    (channel: CampaignChannel) => {
      setValues((prev) => {
        const exists = prev.channels.includes(channel);
        const nextChannels = exists
          ? prev.channels.filter((current) => current !== channel)
          : [...prev.channels, channel];
        return { ...prev, channels: nextChannels };
      });
      setInternalErrors((prev) => {
        if (!prev.channels) return prev;
        const next = { ...prev };
        delete next.channels;
        return next;
      });
      dismissServerError("channels");
    },
    [dismissServerError]
  );

  return {
    values,
    errors,
    status,
    toast,
    handleSubmit,
    updateValue,
    toggleChannel,
    dismissToast,
  };
}

export type { CampaignField };
