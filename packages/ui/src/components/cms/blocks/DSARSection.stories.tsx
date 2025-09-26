import type { Meta, StoryObj } from "@storybook/react";
import DSARSection from "./DSARSection";

const meta: Meta<typeof DSARSection> = {
  component: DSARSection,
  args: {
    headline: "Data requests",
    explanation: "Request export or deletion of your personal data.",
  },
};
export default meta;

export const Default: StoryObj<typeof DSARSection> = {};

