import type { Meta, StoryObj } from "@storybook/react";
import PromoTilesSection from "./PromoTilesSection";

const meta = {
  component: PromoTilesSection,
  args: {
    density: "editorial",
    tiles: [
      { imageSrc: "/a.jpg", caption: "New In", ctaLabel: "Shop" },
      { imageSrc: "/b.jpg", caption: "Best Sellers", ctaLabel: "Explore" },
      { imageSrc: "/c.jpg", caption: "Clearance", ctaLabel: "Save now" },
    ],
  },
} satisfies Meta<typeof PromoTilesSection>;
export default meta;

type Story = StoryObj<typeof meta>;


export const Editorial = {} satisfies Story;

export const Utilitarian = {
  args: { density: "utilitarian" },
} satisfies Story;

