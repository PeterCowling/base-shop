// packages/ui/src/components/cms/page-builder/ThemePanel.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { http, HttpResponse } from "msw";
import ThemePanel from "./ThemePanel";
import { Dialog } from "../../atoms/shadcn";

const themeGetHandler = http.get("/cms/api/shops/:shop/theme", () =>
  HttpResponse.json({
    themeDefaults: { "color.brand": "#2563eb", "font.body": "Inter" },
    themeTokens: { "color.brand": "#2563eb", "font.body": "Inter" },
  })
);

const themePatchHandler = http.patch("/cms/api/shops/:shop/theme", async ({ request }) => {
  await request.json();
  return HttpResponse.json({ ok: true });
});

const meta: Meta<typeof ThemePanel> = {
  title: "CMS/Page Builder/ThemePanel",
  component: ThemePanel,
  parameters: {
    layout: "centered",
    msw: {
      handlers: [themeGetHandler, themePatchHandler],
    },
    docs: {
      description: {
        component: "Panel to preview and edit theme tokens pulled from the CMS; story stubs backend responses.",
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ThemePanel>;

function StoryWithFetchStub() {
  return (
    <Dialog open>
      <ThemePanel />
    </Dialog>
  );
}

export const Basic: Story = {
  render: () => <StoryWithFetchStub />,
};
