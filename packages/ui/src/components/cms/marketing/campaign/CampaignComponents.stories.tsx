import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import CampaignForm from "./CampaignForm";
import CampaignWizard from "./CampaignWizard";
import CampaignPreviewPanel from "./CampaignPreviewPanel";
import CampaignSummaryCard from "./CampaignSummaryCard";
import {
  defaultCampaignValues,
  getCampaignPreview,
  type CampaignPreviewData,
} from "./types";

const meta = {
  title: "CMS/Marketing/Campaign",
  component: CampaignForm,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CampaignForm>;

export default meta;

type Story = StoryObj<typeof meta>;



export const FormWithPreview = {
  render: FormWithPreviewStory,
} satisfies Story;

export const Wizard = {
  render: () => (
    <CampaignWizard
      initialValues={{
        name: "Spring lookbook",
        audience: "Active subscribers",
        startDate: "2024-03-01",
        endDate: "2024-03-31",
      }}
      onSubmit={async () => undefined}
    />
  ),
} satisfies Story;

export const Summary = {
  render: () => (
    <CampaignSummaryCard data={getCampaignPreview(defaultCampaignValues)} />
  ),
} satisfies Story;

// React component (capitalized) so Hooks are valid here.
function FormWithPreviewStory() {
  const [preview, setPreview] = useState<CampaignPreviewData>(
    getCampaignPreview(defaultCampaignValues)
  );
  return (
    <Sidebar sideWidth="w-80" gap={6}>
      <CampaignForm
        defaultValues={{
          name: "Holiday VIP launch",
          audience: "VIP customers in North America",
          startDate: "2024-11-01",
          endDate: "2024-11-15",
          budget: 12000,
        }}
        onSubmit={async () => undefined}
        onPreviewChange={setPreview}
      />
      <CampaignPreviewPanel data={preview} />
    </Sidebar>
  );
}
import { Sidebar } from "../../../atoms/primitives";
