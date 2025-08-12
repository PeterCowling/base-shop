import type { Meta, StoryObj } from "@storybook/react";
import SearchBar from "./SearchBar";
import { rest } from "msw";

const meta: Meta<typeof SearchBar> = {
  title: "CMS/Blocks/SearchBar",
  component: SearchBar,
  parameters: {
    msw: {
      handlers: [
        rest.get("/api/products", (req, res, ctx) => {
          const q = req.url.searchParams.get("q")?.toLowerCase() ?? "";
          const products = [
            { id: "1", title: "Apple", image: "/placeholder.svg", price: 1000 },
            { id: "2", title: "Banana", image: "/placeholder.svg", price: 2000 },
          ].filter((p) => p.title.toLowerCase().includes(q));
          return res(ctx.json(products));
        }),
      ],
    },
  },
};

export default meta;

export const Default: StoryObj<typeof SearchBar> = {
  args: {
    placeholder: "Search products…",
  },
};

