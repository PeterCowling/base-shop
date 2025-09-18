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
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="campaign-name" className="text-sm font-medium">
            Campaign name
          </label>
          <Input
            id="campaign-name"
            value={values.name}
            onChange={(event) => onUpdateValue("name", event.target.value)}
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "campaign-name-error" : undefined}
            placeholder="Holiday VIP launch"
          />
          {errors.name && (
            <p
              id="campaign-name-error"
              className="text-danger text-xs"
              data-token="--color-danger"
            >
              {errors.name}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="campaign-objective" className="text-sm font-medium">
              Objective
            </label>
            <Select
              value={values.objective}
              onValueChange={(value) =>
                onUpdateValue("objective", value as CampaignFormValues["objective"])
              }
            >
              <SelectTrigger id="campaign-objective">
                <SelectValue placeholder="Select objective" />
              </SelectTrigger>
              <SelectContent>
                {campaignObjectives.map((objective) => (
                  <SelectItem key={objective} value={objective}>
                    {objective.charAt(0).toUpperCase() + objective.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="campaign-kpi" className="text-sm font-medium">
              Primary KPI
            </label>
            <Input
              id="campaign-kpi"
              value={values.kpi}
              onChange={(event) => onUpdateValue("kpi", event.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="campaign-description" className="text-sm font-medium">
            Overview
          </label>
          <Textarea
            id="campaign-description"
            value={values.description}
            onChange={(event) => onUpdateValue("description", event.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="campaign-budget" className="text-sm font-medium">
            Total budget
          </label>
          <Input
            id="campaign-budget"
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
            aria-invalid={errors.budget ? "true" : "false"}
            aria-describedby={
              errors.budget ? "campaign-budget-error" : undefined
            }
          />
          {errors.budget && (
            <p
              id="campaign-budget-error"
              className="text-danger text-xs"
              data-token="--color-danger"
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
