import { type Meta, type StoryObj } from "@storybook/react";
import { StatCard } from "./StatCard";

const meta: Meta<typeof StatCard> = {
  title: "Atoms/StatCard",
  component: StatCard,
};
export default meta;

export const Revenue: StoryObj<typeof StatCard> = {
  args: { label: "Revenue", value: "$12k" },
};
export const Sessions: StoryObj<typeof StatCard> = {
  args: { label: "Sessions", value: "3,200" },
};
export const ConversionRate: StoryObj<typeof StatCard> = {
  args: { label: "Conversion Rate", value: "4.5%" },
};
