// packages/ui/src/components/cms/page-builder/LinkPicker.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { http, HttpResponse } from "msw";
import LinkPicker from "./LinkPicker";

const pagesHandler = http.get("/cms/api/pages/:shop", () =>
  HttpResponse.json([
    { id: "p1", slug: "home", seo: { title: { en: "Home" } } },
    { id: "p2", slug: "about", seo: { title: { en: "About" } } },
  ])
);

const productsHandler = http.get("/cms/api/products", () =>
  HttpResponse.json([
    { slug: "blue-shirt", title: "Blue Shirt" },
    { slug: "sneakers", title: "Sneakers" },
  ])
);

const meta: Meta<typeof LinkPicker> = {
  title: "CMS/Page Builder/LinkPicker",
  component: LinkPicker,
  parameters: {
    msw: {
      handlers: [pagesHandler, productsHandler],
    },
    docs: {
      description: {
        component: "Picker dialog to link to CMS pages or products; story stubs API responses for demo.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof LinkPicker>;

function BasicStory() {
  const [open, setOpen] = useState(true);
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

export const Basic: Story = {
  render: () => <BasicStory />,
};
