import type { Meta, StoryObj } from "@storybook/react";
import AgeGateSection from "./AgeGateSection";

const meta: Meta<typeof AgeGateSection> = {
  component: AgeGateSection,
  args: {
    minAge: 18,
    message: "You must confirm you are of legal age to enter this site.",
    rememberDays: 0.01, // short for story testing
  },
};
export default meta;

export const Default: StoryObj<typeof AgeGateSection> = {};

