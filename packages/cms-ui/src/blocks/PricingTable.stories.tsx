import type { Meta, StoryObj } from "@storybook/nextjs";

import PricingTable from "./PricingTable";

const meta: Meta<typeof PricingTable> = {
  title: "CMS Blocks/PricingTable",
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
};
export default meta;

export const Default: StoryObj<typeof PricingTable> = {};
