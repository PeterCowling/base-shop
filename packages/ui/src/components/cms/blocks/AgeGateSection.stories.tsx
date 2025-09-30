import type { Meta, StoryObj } from "@storybook/react";
import AgeGateSection from "./AgeGateSection";

const meta = {
  component: AgeGateSection,
  args: {
    minAge: 18,
    message: "You must confirm you are of legal age to enter this site.",
    rememberDays: 0.01, // short for story testing
  },
} satisfies Meta<typeof AgeGateSection>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;

