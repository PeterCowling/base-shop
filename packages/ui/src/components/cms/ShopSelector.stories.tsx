import type { Meta, StoryObj } from "@storybook/react";
import { http, HttpResponse, delay } from "msw";
import ShopSelector from "./ShopSelector";

const baseShops = ["acme-boutique", "luxury-lab", "flagship-eu"];

const meta: Meta<typeof ShopSelector> = {
  title: "CMS/ShopSelector",
  component: ShopSelector,
  tags: ["autodocs"],
  parameters: {
    msw: {
      handlers: [
        http.get("/api/shops", async () => {
          await delay(120);
          return HttpResponse.json(baseShops, { status: 200 });
        }),
      ],
    },
  },
};
export default meta;

export const Default: StoryObj<typeof ShopSelector> = {};

export const ErrorState: StoryObj<typeof ShopSelector> = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/shops", async () => {
          await delay(120);
          return HttpResponse.json({ error: "mock-error" }, { status: 500 });
        }),
      ],
    },
  },
};
