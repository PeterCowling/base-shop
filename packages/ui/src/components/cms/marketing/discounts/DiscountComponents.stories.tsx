import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import DiscountForm from "./DiscountForm";
import DiscountPreviewPanel from "./DiscountPreviewPanel";
import DiscountSummaryCard from "./DiscountSummaryCard";
import {
  defaultDiscountValues,
  getDiscountPreview,
  type DiscountPreviewData,
} from "./types";

const meta: Meta<typeof DiscountForm> = {
  title: "CMS/Marketing/Discounts",
  component: DiscountForm,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof DiscountForm>;

export const FormWithPreview: Story = {
  render: () => {
    function Example() {
      const [preview, setPreview] = useState<DiscountPreviewData>(
        getDiscountPreview(defaultDiscountValues)
      );
      return (
        <div className="grid gap-6 lg:grid-cols-2">
          <DiscountForm
            defaultValues={{
              code: "VIP30",
              value: 30,
              appliesTo: "Collections: Denim, Jackets",
              startDate: "2024-09-01",
              endDate: "2024-09-15",
            }}
            onSubmit={async () => undefined}
            onPreviewChange={setPreview}
          />
          <DiscountPreviewPanel data={preview} />
        </div>
      );
    }
    return <Example />;
  },
};

export const Summary: Story = {
  render: () => (
    <DiscountSummaryCard data={getDiscountPreview(defaultDiscountValues)} />
  ),
};
