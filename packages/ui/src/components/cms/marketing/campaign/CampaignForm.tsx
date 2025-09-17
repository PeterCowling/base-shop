"use client";

import {
  Button,
  Card,
  CardContent,
  Checkbox,
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
  defaultCampaignValues,
  campaignChannelOptions,
  campaignObjectives,
  getCampaignPreview,
  type CampaignChannel,
  type CampaignFormValues,
  type CampaignFormSectionId,
} from "./types";
import {
  type AsyncSubmissionHandler,
  type SubmissionStatus,
  type ValidationErrors,
} from "../shared";
import { useEffect, useMemo, useState } from "react";

type CampaignField = keyof CampaignFormValues;

type CampaignErrors = ValidationErrors<CampaignField>;

export interface CampaignFormMessages {
  success?: string;
  error?: string;
  validation?: string;
}

export interface CampaignFormProps {
  defaultValues?: Partial<CampaignFormValues>;
  sections?: CampaignFormSectionId[];
  validationErrors?: CampaignErrors;
  onSubmit?: AsyncSubmissionHandler<CampaignFormValues>;
  onStatusChange?: (status: SubmissionStatus) => void;
  onPreviewChange?: (preview: ReturnType<typeof getCampaignPreview>) => void;
  submitLabel?: string;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  busy?: boolean;
  status?: SubmissionStatus;
  messages?: CampaignFormMessages;
  className?: string;
}

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

export function CampaignForm({
  defaultValues,
  sections = ["basics", "audience", "schedule"],
  validationErrors,
  onSubmit,
  onStatusChange,
  onPreviewChange,
  submitLabel = "Save campaign",
  secondaryAction,
  busy,
  status: statusProp,
  messages,
  className,
}: CampaignFormProps) {
  const [values, setValues] = useState<CampaignFormValues>({
    ...defaultCampaignValues,
    ...defaultValues,
  });
  const [internalErrors, setInternalErrors] = useState<CampaignErrors>({});
  const [internalStatus, setInternalStatus] =
    useState<SubmissionStatus>("idle");
  const status = statusProp ?? internalStatus;
  const [toast, setToast] = useState<{ open: boolean; message: string }>(
    { open: false, message: "" }
  );

  useEffect(() => {
    setValues((prev) => ({ ...prev, ...defaultValues }));
  }, [defaultValues]);

  useEffect(() => {
    if (!onPreviewChange) return;
    onPreviewChange(getCampaignPreview(values));
  }, [values, onPreviewChange]);

  const errors = useMemo(
    () => ({
      ...internalErrors,
      ...(validationErrors ?? {}),
    }),
    [internalErrors, validationErrors]
  );

  const markStatus = (next: SubmissionStatus) => {
    if (!statusProp) {
      setInternalStatus(next);
    }
    onStatusChange?.(next);
  };

  const showToast = (message: string) => {
    setToast({ open: true, message });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    markStatus("validating");
    const nextErrors = validateCampaign(values, sections);
    setInternalErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      markStatus("error");
      showToast(messages?.validation ?? "Please review the highlighted fields.");
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
  };

  const updateValue = <K extends CampaignField>(
    key: K,
    value: CampaignFormValues[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setInternalErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const toggleChannel = (channel: CampaignChannel) => {
    setValues((prev) => {
      const exists = prev.channels.includes(channel);
      const nextChannels = exists
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel];
      return { ...prev, channels: nextChannels };
    });
    setInternalErrors((prev) => {
      if (!prev.channels) return prev;
      const next = { ...prev };
      delete next.channels;
      return next;
    });
  };

  const visibleSections = new Set(sections);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-6", className)}
      noValidate
    >
      {visibleSections.has("basics") && (
        <Card>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="campaign-name" className="text-sm font-medium">
                Campaign name
              </label>
              <Input
                id="campaign-name"
                value={values.name}
                onChange={(event) => updateValue("name", event.target.value)}
                aria-invalid={errors.name ? "true" : "false"}
                aria-describedby={errors.name ? "campaign-name-error" : undefined}
                placeholder="Holiday VIP launch"
              />
              {errors.name && (
                <p
                  id="campaign-name-error"
                  className="text-danger text-xs"
                  data-token="--color-danger"
                >
                  {errors.name}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="campaign-objective" className="text-sm font-medium">
                  Objective
                </label>
                <Select
                  value={values.objective}
                  onValueChange={(value) => updateValue("objective", value as CampaignFormValues["objective"])}
                >
                  <SelectTrigger id="campaign-objective">
                    <SelectValue placeholder="Select objective" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaignObjectives.map((objective) => (
                      <SelectItem key={objective} value={objective}>
                        {objective.charAt(0).toUpperCase() + objective.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label htmlFor="campaign-kpi" className="text-sm font-medium">
                  Primary KPI
                </label>
                <Input
                  id="campaign-kpi"
                  value={values.kpi}
                  onChange={(event) => updateValue("kpi", event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="campaign-description" className="text-sm font-medium">
                Overview
              </label>
              <Textarea
                id="campaign-description"
                value={values.description}
                onChange={(event) => updateValue("description", event.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="campaign-budget" className="text-sm font-medium">
                Total budget
              </label>
              <Input
                id="campaign-budget"
                type="number"
                value={values.budget ? String(values.budget) : ""}
                onChange={(event) =>
                  updateValue(
                    "budget",
                    event.target.value === ""
                      ? 0
                      : Number(event.target.value)
                  )
                }
                min={0}
                step={100}
                aria-invalid={errors.budget ? "true" : "false"}
                aria-describedby={errors.budget ? "campaign-budget-error" : undefined}
              />
              {errors.budget && (
                <p
                  id="campaign-budget-error"
                  className="text-danger text-xs"
                  data-token="--color-danger"
                >
                  {errors.budget}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {visibleSections.has("audience") && (
        <Card>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="campaign-audience" className="text-sm font-medium">
                Audience filters
              </label>
              <Textarea
                id="campaign-audience"
                value={values.audience}
                onChange={(event) => updateValue("audience", event.target.value)}
                placeholder="Customers who purchased in the last 90 days"
                rows={3}
                aria-invalid={errors.audience ? "true" : "false"}
                aria-describedby={
                  errors.audience ? "campaign-audience-error" : undefined
                }
              />
              {errors.audience && (
                <p
                  id="campaign-audience-error"
                  className="text-danger text-xs"
                  data-token="--color-danger"
                >
                  {errors.audience}
                </p>
              )}
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Channels</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {campaignChannelOptions.map((channel) => {
                  const checked = values.channels.includes(channel);
                  return (
                    <label
                      key={channel}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleChannel(channel)}
                      />
                      <span className="capitalize">{channel.replace("-", " ")}</span>
                    </label>
                  );
                })}
              </div>
              {errors.channels && (
                <p
                  className="text-danger text-xs"
                  data-token="--color-danger"
                >
                  {errors.channels}
                </p>
              )}
            </fieldset>
          </CardContent>
        </Card>
      )}

      {visibleSections.has("schedule") && (
        <Card>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="campaign-start" className="text-sm font-medium">
                Start date
              </label>
              <Input
                id="campaign-start"
                type="date"
                value={values.startDate}
                onChange={(event) => updateValue("startDate", event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="campaign-end" className="text-sm font-medium">
                End date
              </label>
              <Input
                id="campaign-end"
                type="date"
                value={values.endDate}
                onChange={(event) => updateValue("endDate", event.target.value)}
                aria-invalid={errors.endDate ? "true" : "false"}
                aria-describedby={errors.endDate ? "campaign-end-error" : undefined}
              />
              {errors.endDate && (
                <p
                  id="campaign-end-error"
                  className="text-danger text-xs"
                  data-token="--color-danger"
                >
                  {errors.endDate}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {secondaryAction && (
          <Button
            type="button"
            variant="outline"
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </Button>
        )}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-muted-foreground text-xs">
            {status === "submitting"
              ? "Saving campaign…"
              : status === "success"
              ? "Ready to launch"
              : undefined}
          </span>
          <Button type="submit" disabled={busy || status === "submitting"}>
            {submitLabel}
          </Button>
        </div>
      </div>

      <Toast
        open={toast.open}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </form>
  );
}

export default CampaignForm;
