import type { Meta, StoryObj } from "@storybook/nextjs";

import EmailReferralSection from "./EmailReferralSection";

const meta: Meta<typeof EmailReferralSection> = {
  title: "CMS Blocks/EmailReferralSection",
  component: EmailReferralSection,
  args: {
    headline: "Give $10, Get $10",
    subtitle: "Invite a friend and both get rewarded.",
  },
};
export default meta;

export const Default: StoryObj<typeof EmailReferralSection> = {};

