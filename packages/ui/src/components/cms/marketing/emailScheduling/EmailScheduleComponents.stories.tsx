import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";

import EmailScheduleForm from "./EmailScheduleForm";
import EmailSchedulePreviewPanel from "./EmailSchedulePreviewPanel";
import EmailScheduleSummaryCard from "./EmailScheduleSummaryCard";
import {
  defaultEmailScheduleValues,
  type EmailSchedulePreviewData,
  getEmailSchedulePreview,
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
    function Example() {
      const [preview, setPreview] = useState<EmailSchedulePreviewData>(
        getEmailSchedulePreview(defaultEmailScheduleValues)
      );
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          <EmailScheduleForm
            defaultValues={{
              subject: "Launch day reminder",
              sendDate: "2024-05-01",
              segment: "vip",
              timezone: "Europe/Berlin",
            }}
            onSubmit={async () => undefined}
            onPreviewChange={setPreview}
          />
          <EmailSchedulePreviewPanel data={preview} />
        </div>
      );
    }
    return <Example />;
  },
};

export const Summary: Story = {
  render: () => (
    <EmailScheduleSummaryCard
      data={getEmailSchedulePreview(defaultEmailScheduleValues)}
    />
  ),
};
