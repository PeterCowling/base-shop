import type { Meta, StoryObj } from "@storybook/react";
import PricingTable from "./PricingTable";

const meta = {
  component: PricingTable,
  args: {
    plans: [
      {
        title: "Basic",
        price: "$10/mo",
        features: ["Feature A", "Feature B"],
        ctaLabel: "Choose Basic",
        ctaHref: "#",
      },
      {
        title: "Pro",
        price: "$20/mo",
        features: ["Feature A", "Feature B", "Feature C"],
        ctaLabel: "Choose Pro",
        ctaHref: "#",
        featured: true,
      },
      {
        title: "Enterprise",
        price: "$50/mo",
        features: ["Everything in Pro", "Dedicated Support"],
        ctaLabel: "Contact Us",
        ctaHref: "#",
      },
    ],
  },
} satisfies Meta<typeof PricingTable>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Default = {} satisfies Story;
