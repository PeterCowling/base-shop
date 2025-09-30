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
import { useTranslations } from "@acme/i18n";

const meta = {
  title: "CMS/Marketing/Discounts",
  component: DiscountForm,
  parameters: { layout: "padded" },
} satisfies Meta<typeof DiscountForm>;

export default meta;

type Story = StoryObj<typeof meta>;



export const FormWithPreview = {
  render: () => {
    function Example() {
      const t = useTranslations();
      const [preview, setPreview] = useState<DiscountPreviewData>(
        getDiscountPreview(defaultDiscountValues, t)
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
} satisfies Story;

export const Summary = {
  render: () => {
    function Example() {
      const t = useTranslations();
      return (
        <DiscountSummaryCard data={getDiscountPreview(defaultDiscountValues, t)} />
      );
    }
    return <Example />;
  },
} satisfies Story;
