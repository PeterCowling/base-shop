// packages/ui/src/components/cms/page-builder/LinkPicker.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs";
import React, { useState } from "react";
import { http, HttpResponse, delay } from "msw";
import LinkPicker from "./LinkPicker";

const pagesFixture = [
  { id: "p1", slug: "home", seo: { title: { en: "Home" } } },
  { id: "p2", slug: "about", seo: { title: { en: "About" } } },
];

const productsFixture = [
  { slug: "blue-shirt", title: "Blue Shirt" },
  { slug: "sneakers", title: "Sneakers" },
];

const meta: Meta<typeof LinkPicker> = {
  title: "CMS/Page Builder/LinkPicker",
  component: LinkPicker,
  parameters: {
    docs: {
      description: {
        component: "Picker dialog to link to CMS pages or products; story stubs API responses for demo.",
      },
    },
    msw: {
      handlers: [
        http.get(/\/cms\/api\/pages\/.+/, async () => {
          await delay(120);
          return HttpResponse.json(pagesFixture, { status: 200 });
        }),
        http.get("/cms/api/products", async ({ request }) => {
          await delay(80);
          const url = new URL(request.url);
          const query = url.searchParams.get("q");
          const list = query
            ? productsFixture.filter((item) =>
                `${item.slug} ${item.title}`.toLowerCase().includes(query.toLowerCase()),
              )
            : productsFixture;
          return HttpResponse.json(list, { status: 200 });
        }),
      ],
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
