// packages/ui/src/components/cms/page-builder/ThemePanel.stories.tsx
import React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs";
import { http, HttpResponse } from "msw";

import { Dialog } from "../../atoms/shadcn";

import ThemePanel from "./ThemePanel";

const themeResponse = {
  themeDefaults: { "color.brand": "var(--color-bg-dark)", "font.body": "Inter" },
  themeTokens: { "color.brand": "var(--color-bg-dark)", "font.body": "Inter" },
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
