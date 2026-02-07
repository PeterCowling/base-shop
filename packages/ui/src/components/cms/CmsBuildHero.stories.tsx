import type { Meta, StoryObj } from "@storybook/nextjs";

import { CmsBuildHero } from "./CmsBuildHero";

const meta: Meta<typeof CmsBuildHero> = {
  title: "CMS/CmsBuildHero",
  component: CmsBuildHero,
  parameters: {
    layout: "padded",
  },
};

export default meta;

type Story = StoryObj<typeof CmsBuildHero>;

export const Build: Story = {
  args: {
    tag: "Shop build",
    title: "Launch in under an hour",
    body: "Follow the configurator steps to get a launch‑ready shop with a single product, payments, and shipping configured.",
    tone: "build",
    inlineMeta: [
      { id: "checks", label: "Checks passed", value: "5/7" },
      { id: "time", label: "Time so far", value: "24 min" },
      { id: "products", label: "Products added", value: "3" },
    ],
  },
};

export const Operate: Story = {
  args: {
    tag: "Operate",
    title: "Keep your shop healthy",
    body: "Monitor health, run upgrades, and adjust settings without breaking your launch‑ready storefront.",
    tone: "operate",
  },
};

export const Upgrade: Story = {
  args: {
    tag: "Upgrade",
    title: "Preview component upgrades safely",
    body: "Review changes in the upgrade preview before republishing to production.",
    tone: "upgrade",
  },
};

