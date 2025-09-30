import type { Meta, StoryObj } from "@storybook/react";
import DSARSection from "./DSARSection";

const meta = {
  component: DSARSection,
  args: {
    headline: "Data requests",
    explanation: "Request export or deletion of your personal data.",
  },
} satisfies Meta<typeof DSARSection>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

