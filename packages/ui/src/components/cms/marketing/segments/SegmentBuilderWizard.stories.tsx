import type { Meta, StoryObj } from "@storybook/react";
import SegmentBuilderWizard from "./SegmentBuilderWizard";
import { defaultSegmentDefinition } from "./types";

const meta: Meta<typeof SegmentBuilderWizard> = {
  title: "CMS/Marketing/Segments/Wizard",
  component: SegmentBuilderWizard,
  parameters: { layout: "padded" },
};

export default meta;

type Story = StoryObj<typeof SegmentBuilderWizard>;

export const Default: Story = {
  args: {
    initialDefinition: {
      ...defaultSegmentDefinition,
      name: "High value repeat shoppers",
      description: "Customers with 3+ orders and lifetime value over $500.",
      estimatedSize: 5400,
    },
    onSubmit: async () => undefined,
  },
};
