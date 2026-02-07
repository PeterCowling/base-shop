import type { Meta, StoryObj } from "@storybook/react";

import { Accordion } from "./Accordion";

const meta: Meta<typeof Accordion> = {
  title: "Molecules/Accordion",
  component: Accordion,
  args: {
    items: [
      { title: "Shipping information", content: "Standard delivery in 3–5 business days. Expedited options available at checkout." },
      { title: "Returns", content: "Free returns within 30 days in original condition." },
      { title: "Care", content: "Machine wash cold, hang dry. Avoid bleach." },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {};

export const LongContent: Story = {
  args: {
    items: [
      {
        title: "Long string resilience",
        content:
          "SupercalifragilisticexpialidociousSupercalifragilisticexpialidociousWithNoSpaces to test wrapping and overflow handling in the accordion body.",
      },
    ],
  },
};
