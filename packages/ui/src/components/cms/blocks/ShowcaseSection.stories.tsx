import type { Meta, StoryObj } from "@storybook/react";
import ShowcaseSection from "./ShowcaseSection";
import { http, HttpResponse } from "msw";
import { PRODUCTS } from "@acme/platform-core/products/index";

const meta: Meta<typeof ShowcaseSection> = {
  component: ShowcaseSection,
  tags: ["autodocs"],
  args: {
    preset: "featured",
    layout: "carousel",
  },
};
export default meta;

export const Carousel: StoryObj<typeof ShowcaseSection> = {};

export const Grid: StoryObj<typeof ShowcaseSection> = {
  args: { layout: "grid", gridCols: 3 },
};

// Demonstrates per-story MSW override returning a custom list
export const BestsellersMock: StoryObj<typeof ShowcaseSection> = {
  name: "Bestsellers (Mocked)",
  args: { preset: "bestsellers", layout: "carousel" },
  parameters: {
    msw: {
      handlers: [
        http.get("/api/recommendations", ({ request }) => {
          // Return a deterministic subset regardless of preset
          const list = [...PRODUCTS].sort((a, b) => (b.price ?? 0) - (a.price ?? 0)).slice(0, 2);
          return HttpResponse.json(list, { status: 200 });
        }),
      ],
    },
  },
};
