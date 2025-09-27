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
  // i18n-exempt — non-UI default; surfaced by components which translate
  /* i18n-exempt */
  kpi: "Conversions",
};

export function getCampaignPreview(
  values: CampaignFormValues
): CampaignPreviewData {
  // i18n-exempt — util used by UI; strings are wrapped at call sites
  /* i18n-exempt */
  const t = (s: string) => s;
  const timeframe = values.startDate && values.endDate
    ? `${values.startDate} → ${values.endDate}`
    : values.startDate
    ? t(`Starts ${values.startDate}`)
    : t("Schedule pending");

  return {
    title: values.name || t("Untitled campaign"),
    objective: values.objective,
    timeframe,
    audienceSummary:
      values.audience || t("Audience filters not configured yet."),
    channels: values.channels,
    budgetLabel:
      values.budget > 0
        ? new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
          }).format(values.budget)
        : t("Budget pending"),
    kpi: values.kpi,
  };
}
