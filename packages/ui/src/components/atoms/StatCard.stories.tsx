import { type Meta, type StoryObj } from "@storybook/nextjs";
import { StatCard } from "./StatCard";

const meta: Meta<typeof StatCard> = {
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

export const WithCustomStyles: StoryObj<typeof StatCard> = {
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
};
