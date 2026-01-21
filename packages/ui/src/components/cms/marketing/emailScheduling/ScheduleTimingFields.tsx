"use client";

import { useTranslations } from "@acme/i18n";

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

const timezoneOptions = [
  "America/New_York", // i18n-exempt: IANA timezone identifier, not translatable
  "America/Los_Angeles", // i18n-exempt: IANA timezone identifier, not translatable
  "Europe/Berlin", // i18n-exempt: IANA timezone identifier, not translatable
  "Europe/London", // i18n-exempt: IANA timezone identifier, not translatable
  "Asia/Tokyo", // i18n-exempt: IANA timezone identifier, not translatable
] as const;

const segmentOptions = [
  "all",
  "vip",
  "winback",
  "abandoned",
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
          <label htmlFor="email-send-date" className="text-sm font-medium"> {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
            {t("emailScheduling.form.sendDateLabel")}
          </label>
          <Input
            id="email-send-date" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
            type="date"
            value={values.sendDate}
            onChange={(event) => onUpdate("sendDate", event.target.value)}
            aria-invalid={errors.sendDate ? "true" : "false"}
            aria-describedby={
              errors.sendDate ? "email-send-date-error" : undefined // i18n-exempt -- DS-1234 [ttl=2025-11-30]
            }
          />
          {errors.sendDate && (
            <p
              id="email-send-date-error" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
              className="text-danger text-xs"
              data-token="--color-danger" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
            >
              {errors.sendDate}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="email-send-time" className="text-sm font-medium"> {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
            {t("emailScheduling.form.sendTimeLabel")}
          </label>
          <Input
            id="email-send-time" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
            type="time"
            value={values.sendTime}
            onChange={(event) => onUpdate("sendTime", event.target.value)}
            aria-invalid={errors.sendTime ? "true" : "false"}
            aria-describedby={
              errors.sendTime ? "email-send-time-error" : undefined // i18n-exempt -- DS-1234 [ttl=2025-11-30]
            }
          />
          {errors.sendTime && (
            <p
              id="email-send-time-error" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
              className="text-danger text-xs"
              data-token="--color-danger" // i18n-exempt -- DS-1234 [ttl=2025-11-30]
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
                  {zone} {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] — IANA timezone identifier */}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.timezone && (
            <p className="text-danger text-xs" data-token="--color-danger"> {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
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
                  {t(`emailScheduling.segment.${segment}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.segment && (
            <p className="text-danger text-xs" data-token="--color-danger"> {/* i18n-exempt -- DS-1234 [ttl=2025-11-30] */}
              {errors.segment}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ScheduleTimingFields;
