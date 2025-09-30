"use client";

import { Card, CardContent, Input } from "../../../atoms/shadcn";
import { Switch } from "../../../atoms";
import type { EmailScheduleErrors } from "./hooks/useEmailScheduleFormState";
import type { EmailScheduleFormValues } from "./types";
import { useTranslations } from "@acme/i18n";

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
  const t = useTranslations();
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium">{t("emailScheduling.followUp.title")}</h3>
            <p className="text-muted-foreground text-xs">
              {t("emailScheduling.followUp.helpText")}
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
            <label htmlFor="follow-up-delay" className="text-sm font-medium"> {/* i18n-exempt -- INTL-204 DOM htmlFor attribute, not user-facing copy [ttl=2026-12-31] */}
              {t("emailScheduling.followUp.delayLabel")}
            </label>
            <Input
              id="follow-up-delay" // i18n-exempt -- INTL-204 DOM id attribute, not user-facing copy [ttl=2026-12-31]
              type="number"
              min={1}
              value={String(values.followUpDelayHours)}
              onChange={(event) =>
                onUpdate("followUpDelayHours", Number(event.target.value || 0))
              }
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? "follow-up-delay-error" : undefined} // i18n-exempt -- INTL-204 DOM id reference, not user-facing copy [ttl=2026-12-31]
            />
            {error && (
              <p
                id="follow-up-delay-error" // i18n-exempt -- INTL-204 DOM id attribute, not user-facing copy [ttl=2026-12-31]
                className="text-danger text-xs"
                data-token="--color-danger" // i18n-exempt -- INTL-204 design token identifier, not user-facing copy [ttl=2026-12-31]
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
