import { type Meta, type StoryObj } from "@storybook/react";
import { StatCard } from "./StatCard";

const meta = {
  title: "Atoms/StatCard",
  component: StatCard,
  parameters: {
    docs: {
      description: {
        component:
          "Display a primary metric and short label. Forward Tailwind classes through `className` to adjust colours or spacing, and provide any React node as the `value`.",
      },
    },
  },
  argTypes: {
    className: {
      control: false,
      description: "Tailwind classes applied to the root card",
    },
  },
} satisfies Meta<typeof StatCard>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Revenue = {
  args: { label: "Revenue", value: "$12k" },
} satisfies Story;
export const Sessions = {
  args: { label: "Sessions", value: "3,200" },
} satisfies Story;
export const ConversionRate = {
  args: { label: "Conversion Rate", value: "4.5%" },
} satisfies Story;

export const WithCustomStyles = {
  args: {
    label: "Net promoter score",
    value: "+64",
    className:
      "bg-emerald-50 border border-emerald-200 [&>div]:text-emerald-900",
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use the `className` prop to align the card with brand palettes or contextual backgrounds.",
      },
    },
  },
} satisfies Story;
