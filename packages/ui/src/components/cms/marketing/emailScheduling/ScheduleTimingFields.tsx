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

const timezoneOptions = [
  "America/New_York",
  "America/Los_Angeles",
  "Europe/Berlin",
  "Europe/London",
  "Asia/Tokyo",
] as const;

const segmentOptions = [
  "All subscribers",
  "VIP customers",
  "Winback cohort",
  "Abandoned checkout",
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
  return (
    <Card>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="email-send-date" className="text-sm font-medium">
            Send date
          </label>
          <Input
            id="email-send-date"
            type="date"
            value={values.sendDate}
            onChange={(event) => onUpdate("sendDate", event.target.value)}
            aria-invalid={errors.sendDate ? "true" : "false"}
            aria-describedby={
              errors.sendDate ? "email-send-date-error" : undefined
            }
          />
          {errors.sendDate && (
            <p
              id="email-send-date-error"
              className="text-danger text-xs"
              data-token="--color-danger"
            >
              {errors.sendDate}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor="email-send-time" className="text-sm font-medium">
            Send time
          </label>
          <Input
            id="email-send-time"
            type="time"
            value={values.sendTime}
            onChange={(event) => onUpdate("sendTime", event.target.value)}
            aria-invalid={errors.sendTime ? "true" : "false"}
            aria-describedby={
              errors.sendTime ? "email-send-time-error" : undefined
            }
          />
          {errors.sendTime && (
            <p
              id="email-send-time-error"
              className="text-danger text-xs"
              data-token="--color-danger"
            >
              {errors.sendTime}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Timezone</label>
          <Select
            value={values.timezone}
            onValueChange={(value) => onUpdate("timezone", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
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
            <p className="text-danger text-xs" data-token="--color-danger">
              {errors.timezone}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">Segment</label>
          <Select
            value={values.segment}
            onValueChange={(value) => onUpdate("segment", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select segment" />
            </SelectTrigger>
            <SelectContent>
              {segmentOptions.map((segment) => (
                <SelectItem key={segment} value={segment}>
                  {segment}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.segment && (
            <p className="text-danger text-xs" data-token="--color-danger">
              {errors.segment}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default ScheduleTimingFields;
