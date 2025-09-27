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
        http.get("/api/recommendations", () => {
          // Return a deterministic subset regardless of preset
          const list = [...PRODUCTS].sort((a, b) => (b.price ?? 0) - (a.price ?? 0)).slice(0, 2);
          return HttpResponse.json(list, { status: 200 });
        }),
      ],
    },
  },
};

// Error visualization: shows a simple banner when the Net Error toolbar is ON
export const ErrorStateCarousel: StoryObj<typeof ShowcaseSection> = {
  name: "Error state (carousel)",
  args: { preset: "featured", layout: "carousel" },
  render: (args) => {
    const netError = (typeof window !== 'undefined' && window.__SB_GLOBALS__?.netError) === 'on';
    return (
      <div>
        {netError ? (
          <div
            style={{
              background: 'hsl(var(--color-danger) / 0.12)',
              color: 'hsl(var(--color-danger))',
              padding: 'var(--space-2)',
              border: '1px solid hsl(var(--color-danger) / 0.25)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Simulated network error — failed to load recommendations.
          </div>
        ) : null}
        <ShowcaseSection {...args} />
      </div>
    );
  },
};

export const ErrorStateGrid: StoryObj<typeof ShowcaseSection> = {
  name: "Error state (grid)",
  args: { preset: "featured", layout: "grid", gridCols: 3 },
  render: (args) => {
    const netError = (typeof window !== 'undefined' && window.__SB_GLOBALS__?.netError) === 'on';
    return (
      <div>
        {netError ? (
          <div
            style={{
              background: 'hsl(var(--color-danger) / 0.12)',
              color: 'hsl(var(--color-danger))',
              padding: 'var(--space-2)',
              border: '1px solid hsl(var(--color-danger) / 0.25)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Simulated network error — failed to load recommendations.
          </div>
        ) : null}
        <ShowcaseSection {...args} />
      </div>
    );
  },
};

declare global {
  interface Window {
    __SB_GLOBALS__?: { netError?: string };
  }
}
