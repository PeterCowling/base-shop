import type { Meta, StoryObj } from "@storybook/react";
import PromoTilesSection from "./PromoTilesSection";

const meta: Meta<typeof PromoTilesSection> = {
  component: PromoTilesSection,
  args: {
    density: "editorial",
    tiles: [
      { imageSrc: "/a.jpg", caption: "New In", ctaLabel: "Shop" },
      { imageSrc: "/b.jpg", caption: "Best Sellers", ctaLabel: "Explore" },
      { imageSrc: "/c.jpg", caption: "Clearance", ctaLabel: "Save now" },
    ],
  },
};
export default meta;

export const Editorial: StoryObj<typeof PromoTilesSection> = {};

export const Utilitarian: StoryObj<typeof PromoTilesSection> = {
  args: { density: "utilitarian" },
};

