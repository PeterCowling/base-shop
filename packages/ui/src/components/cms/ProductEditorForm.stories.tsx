import type { ProductPublication } from "@acme/types";
import type { Locale } from "@acme/i18n";
import type { Meta, StoryObj } from "@storybook/react";
import ProductEditorForm from "./ProductEditorForm";

const sample: ProductPublication & { variants: Record<string, string[]> } = {
  id: "1",
  sku: "SAMPLE-1",
  title: { en: "Sample", de: "Sample", it: "Sample" },
  description: {
    en: "Sample product",
    de: "Sample product",
    it: "Sample product",
  },
  price: 1000,
  currency: "EUR",
  media: [],
  status: "draft",
  shop: "demo",
  row_version: 1,
  created_at: "",
  updated_at: "",
  // no variants by default
  variants: {},
};

const meta = {
  component: ProductEditorForm,
  args: {
    product: sample,
    locales: ["en", "de", "it"] as Locale[],
    onSave: async () => ({ product: sample }),
  },
  argTypes: {
    product: { control: "object" },
    locales: { control: "object" },
    onSave: { action: "save" },
  },
} satisfies Meta<typeof ProductEditorForm>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
