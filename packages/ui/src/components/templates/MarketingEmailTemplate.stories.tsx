import { type Meta, type StoryObj } from "@storybook/react";
import { MarketingEmailTemplate } from "./MarketingEmailTemplate";

const meta: Meta<typeof MarketingEmailTemplate> = {
  component: MarketingEmailTemplate,
  args: {
    logoSrc: "/logo.svg",
    headline: "Welcome to Base Shop",
    content: "Thanks for joining us!",
    ctaLabel: "Shop Now",
    ctaHref: "#",
    footer: "\u00a9 2023 Base Shop",
  },
  argTypes: {
    logoSrc: { control: "text" },
    headline: { control: "text" },
    content: { control: "text" },
    ctaLabel: { control: "text" },
    ctaHref: { control: "text" },
    footer: { control: "text" },
  },
};
export default meta;

export const Default: StoryObj<typeof MarketingEmailTemplate> = {};
