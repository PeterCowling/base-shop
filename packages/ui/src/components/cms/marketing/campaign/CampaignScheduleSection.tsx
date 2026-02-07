"use client";

import { useTranslations } from "@acme/i18n";

import { Card, CardContent, Input } from "../../../atoms/shadcn";

import type { CampaignFormValues } from "./types";
import type {
  CampaignErrors,
  CampaignFormUpdater,
} from "./useCampaignForm";

interface CampaignScheduleSectionProps {
  values: CampaignFormValues;
  errors: CampaignErrors;
  onUpdateValue: CampaignFormUpdater;
}

export function CampaignScheduleSection({
  values,
  errors,
  onUpdateValue,
}: CampaignScheduleSectionProps) {
  const t = useTranslations();
  // i18n-exempt constants for non-UI identifiers and tokens
  // i18n-exempt
  const START_ID = "campaign-start";
  // i18n-exempt
  const END_ID = "campaign-end";
  // i18n-exempt
  const END_ERR_ID = "campaign-end-error";
  // i18n-exempt
  const DATE = "date";
  // i18n-exempt
  const DANGER_TOKEN = "--color-danger";
  return (
    <Card>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={START_ID} className="text-sm font-medium">
            {t("Start date")}
          </label>
          <Input
            id={START_ID}
            type={DATE}
            value={values.startDate}
            onChange={(event) => onUpdateValue("startDate", event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={END_ID} className="text-sm font-medium">
            {t("End date")}
          </label>
          <Input
            id={END_ID}
            type={DATE}
            value={values.endDate}
            onChange={(event) => onUpdateValue("endDate", event.target.value)}
            aria-invalid={errors.endDate ? "true" : "false"}
            aria-describedby={errors.endDate ? END_ERR_ID : undefined}
          />
          {errors.endDate && (
            <p
              id={END_ERR_ID}
              className="text-danger text-xs"
              data-token={DANGER_TOKEN}
            >
              {errors.endDate}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CampaignScheduleSection;
