import type { Meta, StoryObj } from "@storybook/react";
import PoliciesAccordion from "./PoliciesAccordion";

const meta: Meta<typeof PoliciesAccordion> = {
  component: PoliciesAccordion,
  args: {
    shipping: "<p>Free shipping over $50</p>",
    returns: "<p>30-day returns</p>",
    warranty: "<p>2-year limited warranty</p>",
  },
};
export default meta;

export const Default: StoryObj<typeof PoliciesAccordion> = {};

