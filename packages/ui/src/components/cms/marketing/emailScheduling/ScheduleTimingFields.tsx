"use client";

import {
  Card,
  CardContent,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../atoms/shadcn";
import type { EmailScheduleErrors } from "./hooks/useEmailScheduleFormState";
import type { EmailScheduleFormValues } from "./types";
import { useTranslations } from "@acme/i18n";

const timezoneOptions = [
  "America/New_York", // i18n-exempt: IANA timezone identifier, not translatable
  "America/Los_Angeles", // i18n-exempt: IANA timezone identifier, not translatable
  "Europe/Berlin", // i18n-exempt: IANA timezone identifier, not translatable
  "Europe/London", // i18n-exempt: IANA timezone identifier, not translatable
  "Asia/Tokyo", // i18n-exempt: IANA timezone identifier, not translatable
] as const;

const segmentOptions = [
  "All subscribers", // i18n-exempt -- translated at render time via t()
  "VIP customers", // i18n-exempt -- translated at render time via t()
  "Winback cohort", // i18n-exempt -- translated at render time via t()
  "Abandoned checkout", // i18n-exempt -- translated at render time via t()
] as const;

type ScheduleTimingField = "sendDate" | "sendTime" | "timezone" | "segment";

type ScheduleTimingValues = Pick<EmailScheduleFormValues, ScheduleTimingField>;
type ScheduleTimingErrors = Pick<EmailScheduleErrors, ScheduleTimingField>;

export interface ScheduleTimingFieldsProps {
  values: ScheduleTimingValues;
  errors: ScheduleTimingErrors;
  onUpdate: <K extends ScheduleTimingField>(
    key: K,
    value: EmailScheduleFormValues[K]
  ) => void;
}

export function ScheduleTimingFields({
  values,
  errors,
  onUpdate,
}: ScheduleTimingFieldsProps) {
  const t = useTranslations();
  return (
    <Card>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="email-send-date" className="text-sm font-medium"> {/* i18n-exempt: DOM htmlFor attribute, not user-facing copy */}
            {t("emailScheduling.form.sendDateLabel")}
          </label>
          <Input
            id="email-send-date" // i18n-exempt: DOM id attribute, not user-facing copy
            type="date"
            value={values.sendDate}
            onChange={(event) => onUpdate("sendDate", event.target.value)}
            aria-invalid={errors.sendDate ? "true" : "false"}
            aria-describedby={
              errors.sendDate ? "email-send-date-error" : undefined // i18n-exempt: DOM id reference, not user-facing copy
            }
          />
          {errors.sendDate && (
            <p
              id="email-send-date-error" // i18n-exempt: DOM id attribute, not user-facing copy
              className="text-danger text-xs"
              data-token="--color-danger" // i18n-exempt: design token identifier, not user-facing copy
            >
              {errors.sendDate}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="email-send-time" className="text-sm font-medium"> {/* i18n-exempt: DOM htmlFor attribute, not user-facing copy */}
            {t("emailScheduling.form.sendTimeLabel")}
          </label>
          <Input
            id="email-send-time" // i18n-exempt: DOM id attribute, not user-facing copy
            type="time"
            value={values.sendTime}
            onChange={(event) => onUpdate("sendTime", event.target.value)}
            aria-invalid={errors.sendTime ? "true" : "false"}
            aria-describedby={
              errors.sendTime ? "email-send-time-error" : undefined // i18n-exempt: DOM id reference, not user-facing copy
            }
          />
          {errors.sendTime && (
            <p
              id="email-send-time-error" // i18n-exempt: DOM id attribute, not user-facing copy
              className="text-danger text-xs"
              data-token="--color-danger" // i18n-exempt: design token identifier, not user-facing copy
            >
              {errors.sendTime}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">{t("emailScheduling.form.timezoneLabel")}</label>
          <Select
            value={values.timezone}
            onValueChange={(value) => onUpdate("timezone", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={String(t("emailScheduling.form.selectTimezonePlaceholder"))} />
            </SelectTrigger>
            <SelectContent>
              {timezoneOptions.map((zone) => (
                <SelectItem key={zone} value={zone}>
                  {zone}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.timezone && (
            <p className="text-danger text-xs" data-token="--color-danger"> {/* i18n-exempt: design token identifier, not user-facing copy */}
              {errors.timezone}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">{t("emailScheduling.form.segmentLabel")}</label>
          <Select
            value={values.segment}
            onValueChange={(value) => onUpdate("segment", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={String(t("emailScheduling.form.selectSegmentPlaceholder"))} />
            </SelectTrigger>
            <SelectContent>
              {segmentOptions.map((segment) => (
                <SelectItem key={segment} value={segment}>
                  {t(segment)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.segment && (
            <p className="text-danger text-xs" data-token="--color-danger"> {/* i18n-exempt: design token identifier, not user-facing copy */}
              {errors.segment}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ScheduleTimingFields;
