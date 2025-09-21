// packages/ui/src/components/cms/page-builder/LinkPicker.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import React, { useEffect, useState } from "react";
import LinkPicker from "./LinkPicker";

const meta: Meta<typeof LinkPicker> = {
  title: "CMS/Page Builder/LinkPicker",
  component: LinkPicker,
};
export default meta;

type Story = StoryObj<typeof LinkPicker>;

export const Basic: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    useEffect(() => {
      const orig = window.fetch;
      (window as any).fetch = async (url: RequestInfo) => {
        const u = String(url);
        if (u.includes("/cms/api/pages/")) {
          return new Response(
            JSON.stringify([
              { id: "p1", slug: "home", seo: { title: { en: "Home" } } },
              { id: "p2", slug: "about", seo: { title: { en: "About" } } },
            ]),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        if (u.includes("/cms/api/products")) {
          return new Response(
            JSON.stringify([
              { slug: "blue-shirt", title: "Blue Shirt" },
              { slug: "sneakers", title: "Sneakers" },
            ]),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return orig(url as any);
      };
      return () => {
        (window as any).fetch = orig;
      };
    }, []);

    return (
      <LinkPicker
        open={open}
        onClose={() => setOpen(false)}
        onPick={(href) => {
          alert(`Picked: ${href}`);
          setOpen(false);
        }}
        shop="bcd"
      />
    );
  },
};
