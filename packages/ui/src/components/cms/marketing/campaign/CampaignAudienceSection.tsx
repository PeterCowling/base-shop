"use client";

import { Card, CardContent, Checkbox, Textarea } from "../../../atoms/shadcn";
import { Grid } from "../../../atoms/primitives";
import { useTranslations } from "@acme/i18n";
import {
  campaignChannelOptions,
  type CampaignChannel,
  type CampaignFormValues,
} from "./types";
import type {
  CampaignErrors,
  CampaignFormUpdater,
} from "./useCampaignForm";

const CAMPAIGN_AUDIENCE_ID = "campaign-audience"; // i18n-exempt: element id, not user-visible copy
const CAMPAIGN_AUDIENCE_ERROR_ID = "campaign-audience-error"; // i18n-exempt: element id, not user-visible copy
const DANGER_TOKEN = "--color-danger"; // i18n-exempt: design token name, not user-visible copy

interface CampaignAudienceSectionProps {
  values: CampaignFormValues;
  errors: CampaignErrors;
  onUpdateValue: CampaignFormUpdater;
  onToggleChannel: (channel: CampaignChannel) => void;
}

export function CampaignAudienceSection({
  values,
  errors,
  onUpdateValue,
  onToggleChannel,
}: CampaignAudienceSectionProps) {
  const t = useTranslations();
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label
            htmlFor={CAMPAIGN_AUDIENCE_ID}
            className="text-sm font-medium"
          >
            {t("campaign.audience.label")}
          </label>
          <Textarea
            id={CAMPAIGN_AUDIENCE_ID}
            value={values.audience}
            onChange={(event) => onUpdateValue("audience", event.target.value)}
            placeholder={String(t("campaign.audience.placeholder"))}
            rows={3}
            aria-invalid={errors.audience ? "true" : "false"}
            aria-describedby={
              errors.audience ? CAMPAIGN_AUDIENCE_ERROR_ID : undefined
            }
          />
          {errors.audience && (
            <p
              id={CAMPAIGN_AUDIENCE_ERROR_ID}
              className="text-danger text-xs"
              data-token={DANGER_TOKEN}
            >
              {errors.audience}
            </p>
          )}
        </div>

        <fieldset
          className="space-y-2"
          aria-label={String(t("campaign.channels.legend"))}
        >
          <legend className="text-sm font-medium">{t("campaign.channels.legend")}</legend>
          <Grid gap={3} cols={1} className="sm:grid-cols-2">
            {campaignChannelOptions.map((channel) => {
              const checked = values.channels.includes(channel);
              const chanLabel = t(`campaign.channels.${channel}`) as string;
              return (
                <label
                  key={channel}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => onToggleChannel(channel)}
                  />
                  <span className="capitalize">{chanLabel}</span>
                </label>
              );
            })}
          </Grid>
          {errors.channels && (
            <p className="text-danger text-xs" data-token={DANGER_TOKEN}>
              {errors.channels}
            </p>
          )}
        </fieldset>
      </CardContent>
    </Card>
  );
}

export default CampaignAudienceSection;
