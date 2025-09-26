import type { Meta, StoryObj } from "@storybook/react";
import ThankYouSection from "./ThankYouSection";

const meta: Meta<typeof ThankYouSection> = {
  component: ThankYouSection,
  args: {
    headline: "Thank you",
    message: "We’ve emailed your receipt.",
    recommendationPreset: "featured",
  },
};
export default meta;

export const Default: StoryObj<typeof ThankYouSection> = {};

