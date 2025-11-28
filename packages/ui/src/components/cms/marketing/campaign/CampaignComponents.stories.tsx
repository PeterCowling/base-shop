import type { Meta, StoryObj } from "@storybook/nextjs";
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

const meta: Meta<typeof CampaignForm> = {
  title: "CMS/Marketing/Campaign",
  component: CampaignForm,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof CampaignForm>;

export const FormWithPreview: Story = {
  render: FormWithPreviewStory,
};

export const Wizard: Story = {
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
};

export const Summary: Story = {
  render: () => (
    <CampaignSummaryCard data={getCampaignPreview(defaultCampaignValues)} />
  ),
};

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
