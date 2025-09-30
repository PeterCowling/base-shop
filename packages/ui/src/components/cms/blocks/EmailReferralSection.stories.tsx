import type { Meta, StoryObj } from "@storybook/react";
import EmailReferralSection from "./EmailReferralSection";

const meta = {
  component: EmailReferralSection,
  args: {
    headline: "Give $10, Get $10",
    subtitle: "Invite a friend and both get rewarded.",
  },
} satisfies Meta<typeof EmailReferralSection>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

