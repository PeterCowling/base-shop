export const campaignChannelOptions = [
  "email",
  "sms",
  "social",
  "in-app",
  "push",
] as const;

export type CampaignChannel = (typeof campaignChannelOptions)[number];

export const campaignObjectives = [
  "awareness",
  "sales",
  "retention",
  "loyalty",
] as const;

export type CampaignObjective = (typeof campaignObjectives)[number];

export type CampaignFormSectionId = "basics" | "audience" | "schedule";

export interface CampaignFormValues {
  name: string;
  objective: CampaignObjective;
  description: string;
  audience: string;
  budget: number;
  startDate: string;
  endDate: string;
  channels: CampaignChannel[];
  kpi: string;
}

export interface CampaignPreviewData {
  title: string;
  objective: CampaignObjective;
  timeframe: string;
  audienceSummary: string;
  channels: CampaignChannel[];
  budgetLabel: string;
  kpi: string;
}

export const defaultCampaignValues: CampaignFormValues = {
  name: "",
  objective: "awareness",
  description: "",
  audience: "",
  budget: 0,
  startDate: "",
  endDate: "",
  channels: ["email"],
  kpi: "Conversions",
};

export function getCampaignPreview(
  values: CampaignFormValues
): CampaignPreviewData {
  const timeframe = values.startDate && values.endDate
    ? `${values.startDate} → ${values.endDate}`
    : values.startDate
    ? `Starts ${values.startDate}`
    : "Schedule pending";

  return {
    title: values.name || "Untitled campaign",
    objective: values.objective,
    timeframe,
    audienceSummary:
      values.audience || "Audience filters not configured yet.",
    channels: values.channels,
    budgetLabel:
      values.budget > 0
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(values.budget)
        : "Budget pending",
    kpi: values.kpi,
  };
}
