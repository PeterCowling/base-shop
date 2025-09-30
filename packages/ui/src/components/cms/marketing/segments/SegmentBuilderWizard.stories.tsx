import type { Meta, StoryObj } from "@storybook/react";
import SegmentBuilderWizard from "./SegmentBuilderWizard";
import { defaultSegmentDefinition } from "./types";

const meta = {
  title: "CMS/Marketing/Segments/Wizard",
  component: SegmentBuilderWizard,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SegmentBuilderWizard>;

export default meta;

type Story = StoryObj<typeof meta>;



export const Default = {
  args: {
    initialDefinition: {
      ...defaultSegmentDefinition,
      name: "High value repeat shoppers",
      description: "Customers with 3+ orders and lifetime value over $500.",
      estimatedSize: 5400,
    },
    onSubmit: async () => undefined,
  },
} satisfies Story;
