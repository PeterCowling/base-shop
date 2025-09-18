"use client";

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
  return (
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
            onChange={(event) => onUpdateValue("startDate", event.target.value)}
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
            onChange={(event) => onUpdateValue("endDate", event.target.value)}
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
  );
}

export default CampaignScheduleSection;
