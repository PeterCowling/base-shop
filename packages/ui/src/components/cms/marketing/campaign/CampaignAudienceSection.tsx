"use client";

import { Card, CardContent, Checkbox, Textarea } from "../../../atoms/shadcn";
import {
  campaignChannelOptions,
  type CampaignChannel,
  type CampaignFormValues,
} from "./types";
import type {
  CampaignErrors,
  CampaignFormUpdater,
} from "./useCampaignForm";

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
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="campaign-audience" className="text-sm font-medium">
            Audience filters
          </label>
          <Textarea
            id="campaign-audience"
            value={values.audience}
            onChange={(event) => onUpdateValue("audience", event.target.value)}
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
                    onCheckedChange={() => onToggleChannel(channel)}
                  />
                  <span className="capitalize">{channel.replace("-", " ")}</span>
                </label>
              );
            })}
          </div>
          {errors.channels && (
            <p className="text-danger text-xs" data-token="--color-danger">
              {errors.channels}
            </p>
          )}
        </fieldset>
      </CardContent>
    </Card>
  );
}

export default CampaignAudienceSection;
