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
  Textarea,
} from "../../../atoms/shadcn";
import { Grid } from "../../../atoms/primitives";
import { useTranslations } from "@acme/i18n";
import {
  campaignObjectives,
  type CampaignFormValues,
} from "./types";
import type {
  CampaignErrors,
  CampaignFormUpdater,
} from "./useCampaignForm";

interface CampaignBasicsSectionProps {
  values: CampaignFormValues;
  errors: CampaignErrors;
  onUpdateValue: CampaignFormUpdater;
}

export function CampaignBasicsSection({
  values,
  errors,
  onUpdateValue,
}: CampaignBasicsSectionProps) {
  const t = useTranslations();
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="space-y-1">{/* i18n-exempt: CSS utility classes only */}
          <label
            htmlFor="campaign-name" /* i18n-exempt: element id */
            className="text-sm font-medium" /* i18n-exempt: CSS utility classes only */
          >
            {t("campaign.name.label")}
          </label>
          <Input
            id="campaign-name" /* i18n-exempt: element id */
            value={values.name}
            onChange={(event) => onUpdateValue("name", event.target.value)}
            aria-invalid={errors.name ? "true" : "false"} /* i18n-exempt: aria token */
            aria-describedby={errors.name ? "campaign-name-error" : undefined} /* i18n-exempt: element id */
            placeholder={String(t("campaign.name.placeholder"))}
          />
          {errors.name && (
            <p
              id="campaign-name-error" /* i18n-exempt: element id */
              className="text-danger text-xs" /* i18n-exempt: CSS utility classes only */
              data-token="--color-danger" /* i18n-exempt: DS token attribute */
            >
              {errors.name}
            </p>
          )}
        </div>

        <Grid gap={4} cols={1} className="sm:grid-cols-2">
          <div className="space-y-1">{/* i18n-exempt: CSS utility classes only */}
            <label
              htmlFor="campaign-objective" /* i18n-exempt: element id */
              className="text-sm font-medium" /* i18n-exempt: CSS utility classes only */
            >
              {t("campaign.objective.label")}
            </label>
            <Select
              value={values.objective}
              onValueChange={(value) =>
                onUpdateValue("objective", value as CampaignFormValues["objective"])
              }
            >
              <SelectTrigger id="campaign-objective">{/* i18n-exempt: element id */}
                <SelectValue placeholder={String(t("campaign.objective.placeholder"))} />
              </SelectTrigger>
              <SelectContent>
                {campaignObjectives.map((objective) => {
                  const label = t(`campaign.objective.${objective}`) as string;
                  return (
                    <SelectItem key={objective} value={objective}>
                      {label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">{/* i18n-exempt: CSS utility classes only */}
            <label
              htmlFor="campaign-kpi" /* i18n-exempt: element id */
              className="text-sm font-medium" /* i18n-exempt: CSS utility classes only */
            >
              {t("campaign.kpi.label")}
            </label>
            <Input
              id="campaign-kpi" /* i18n-exempt: element id */
              value={values.kpi}
              onChange={(event) => onUpdateValue("kpi", event.target.value)}
            />
          </div>
        </Grid>

        <div className="space-y-1">{/* i18n-exempt: CSS utility classes only */}
          <label
            htmlFor="campaign-description" /* i18n-exempt: element id */
            className="text-sm font-medium" /* i18n-exempt: CSS utility classes only */
          >
            {t("campaign.description.label")}
          </label>
          <Textarea
            id="campaign-description" /* i18n-exempt: element id */
            value={values.description}
            onChange={(event) => onUpdateValue("description", event.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-1">{/* i18n-exempt: CSS utility classes only */}
          <label
            htmlFor="campaign-budget" /* i18n-exempt: element id */
            className="text-sm font-medium" /* i18n-exempt: CSS utility classes only */
          >
            {t("campaign.budget.label")}
          </label>
          <Input
            id="campaign-budget" /* i18n-exempt: element id */
            type="number"
            value={values.budget ? String(values.budget) : ""}
            onChange={(event) =>
              onUpdateValue(
                "budget",
                event.target.value === "" ? 0 : Number(event.target.value)
              )
            }
            min={0}
            step={100}
            aria-invalid={errors.budget ? "true" : "false"} /* i18n-exempt: aria token */
            aria-describedby={
              errors.budget ? "campaign-budget-error" : undefined
            } /* i18n-exempt: element id */
          />
          {errors.budget && (
            <p
              id="campaign-budget-error" /* i18n-exempt: element id */
              className="text-danger text-xs" /* i18n-exempt: CSS utility classes only */
              data-token="--color-danger" /* i18n-exempt: DS token attribute */
            >
              {errors.budget}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default CampaignBasicsSection;
