// packages/ui/src/components/cms/page-builder/ThemePanel.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { http, HttpResponse } from "msw";
import ThemePanel from "./ThemePanel";
import { Dialog } from "../../atoms/shadcn";

const themeResponse = {
  themeDefaults: { "color.brand": "#111827", "font.body": "Inter" },
  themeTokens: { "color.brand": "#111827", "font.body": "Inter" },
};

const meta: Meta<typeof ThemePanel> = {
  title: "CMS/Page Builder/ThemePanel",
  component: ThemePanel,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Panel to preview and edit theme tokens pulled from the CMS; story stubs backend responses.",
      },
    },
    msw: {
      handlers: [
        http.get(/\/cms\/api\/shops\/.+\/theme$/, () => HttpResponse.json(themeResponse)),
        http.patch(/\/cms\/api\/shops\/.+\/theme$/, async ({ request }) => {
          // Echo persisted payload to help with interaction debugging
          const body = await request.json().catch(() => ({}));
          return HttpResponse.json({ ok: true, body });
        }),
      ],
    },
  },
};
export default meta;

type Story = StoryObj<typeof ThemePanel>;

export const Basic: Story = {
  render: () => (
    <Dialog open>
      <ThemePanel />
    </Dialog>
  ),
};
