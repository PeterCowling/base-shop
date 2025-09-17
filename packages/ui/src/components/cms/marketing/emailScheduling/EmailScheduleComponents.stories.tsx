import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import EmailScheduleForm from "./EmailScheduleForm";
import EmailSchedulePreviewPanel from "./EmailSchedulePreviewPanel";
import EmailScheduleSummaryCard from "./EmailScheduleSummaryCard";
import {
  defaultEmailScheduleValues,
  getEmailSchedulePreview,
  type EmailSchedulePreviewData,
} from "./types";

const meta: Meta<typeof EmailScheduleForm> = {
  title: "CMS/Marketing/EmailScheduling",
  component: EmailScheduleForm,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof EmailScheduleForm>;

export const FormWithPreview: Story = {
  render: () => {
    const [preview, setPreview] = useState<EmailSchedulePreviewData>(
      getEmailSchedulePreview(defaultEmailScheduleValues)
    );
    return (
      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <EmailScheduleForm
          defaultValues={{
            subject: "Launch day reminder",
            sendDate: "2024-05-01",
            segment: "VIP customers",
            timezone: "Europe/Berlin",
          }}
          onSubmit={async () => undefined}
          onPreviewChange={setPreview}
        />
        <EmailSchedulePreviewPanel data={preview} />
      </div>
    );
  },
};

export const Summary: Story = {
  render: () => (
    <EmailScheduleSummaryCard
      data={getEmailSchedulePreview(defaultEmailScheduleValues)}
    />
  ),
};
