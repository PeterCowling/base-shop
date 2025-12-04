import type { Meta, StoryObj } from "@storybook/react";
import AnnouncementBar from "./AnnouncementBar";

const meta: Meta<typeof AnnouncementBar> = {
  title: "Organisms/AnnouncementBar",
  component: AnnouncementBar,
  args: {
    message: "Free shipping on orders over $50. New arrivals drop this Friday.",
    ctaLabel: "Learn more",
    href: "/shipping",
  },
};

export default meta;
type Story = StoryObj<typeof AnnouncementBar>;

export const Default: Story = {};

export const LongMessage: Story = {
  args: {
    message:
      "SupercalifragilisticexpialidociousSupercalifragilisticexpialidocious — this tests overflow resilience with an absurdly long unbroken string in the announcement bar.",
  },
};
