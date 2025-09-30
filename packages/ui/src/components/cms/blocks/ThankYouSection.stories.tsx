import type { Meta, StoryObj } from "@storybook/react";
import ThankYouSection from "./ThankYouSection";

const meta = {
  component: ThankYouSection,
  args: {
    headline: "Thank you",
    message: "We’ve emailed your receipt.",
    recommendationPreset: "featured",
  },
} satisfies Meta<typeof ThankYouSection>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

