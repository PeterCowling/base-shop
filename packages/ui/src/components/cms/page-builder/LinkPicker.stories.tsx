// packages/ui/src/components/cms/page-builder/LinkPicker.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import React, { useEffect, useState } from "react";
import LinkPicker from "./LinkPicker";

const meta = {
  title: "CMS/Page Builder/LinkPicker",
  component: LinkPicker,
  parameters: {
    docs: {
      description: {
        component: "Picker dialog to link to CMS pages or products; story stubs API responses for demo.",
      },
    },
  },
} satisfies Meta<typeof LinkPicker>;
export default meta;

type Story = StoryObj<typeof meta>;



function BasicStory() {
  const [open, setOpen] = useState(true);
  useEffect(() => {
    type FetchType = typeof fetch;
    const orig: FetchType = window.fetch.bind(window);
    const override: FetchType = async (input: RequestInfo | URL, init?: RequestInit) => {
      const u = String(input);
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
      return orig(input, init);
    };
    (window as unknown as { fetch: FetchType }).fetch = override;
    return () => {
      (window as unknown as { fetch: FetchType }).fetch = orig;
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
}

export const Basic = {
  render: () => <BasicStory />,
} satisfies Story;
