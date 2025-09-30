import type { Meta, StoryObj } from "@storybook/react";
import PoliciesAccordion from "./PoliciesAccordion";

const meta = {
  component: PoliciesAccordion,
  args: {
    shipping: "<p>Free shipping over $50</p>",
    returns: "<p>30-day returns</p>",
    warranty: "<p>2-year limited warranty</p>",
  },
} satisfies Meta<typeof PoliciesAccordion>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

