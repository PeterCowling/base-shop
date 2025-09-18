"use client";

import { Card, CardContent, Input } from "../../../atoms/shadcn";
import { Switch } from "../../../atoms";
import type { EmailScheduleErrors } from "./hooks/useEmailScheduleFormState";
import type { EmailScheduleFormValues } from "./types";

type FollowUpField = "followUpEnabled" | "followUpDelayHours";

type FollowUpValues = Pick<EmailScheduleFormValues, FollowUpField>;

type FollowUpError = EmailScheduleErrors["followUpDelayHours"];

export interface FollowUpControlsProps {
  values: FollowUpValues;
  error?: FollowUpError;
  onUpdate: <K extends FollowUpField>(
    key: K,
    value: EmailScheduleFormValues[K]
  ) => void;
}

export function FollowUpControls({ values, error, onUpdate }: FollowUpControlsProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium">Follow-up email</h3>
            <p className="text-muted-foreground text-xs">
              Send a reminder to non-openers after a delay.
            </p>
          </div>
          <Switch
            checked={values.followUpEnabled}
            onChange={(event) => onUpdate("followUpEnabled", event.target.checked)}
            aria-checked={values.followUpEnabled}
          />
        </div>
        {values.followUpEnabled && (
          <div className="space-y-1">
            <label htmlFor="follow-up-delay" className="text-sm font-medium">
              Delay in hours
            </label>
            <Input
              id="follow-up-delay"
              type="number"
              min={1}
              value={String(values.followUpDelayHours)}
              onChange={(event) =>
                onUpdate("followUpDelayHours", Number(event.target.value || 0))
              }
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "follow-up-delay-error" : undefined}
            />
            {error && (
              <p
                id="follow-up-delay-error"
                className="text-danger text-xs"
                data-token="--color-danger"
              >
                {error}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default FollowUpControls;
