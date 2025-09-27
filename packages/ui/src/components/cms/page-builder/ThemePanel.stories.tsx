// packages/ui/src/components/cms/page-builder/ThemePanel.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import React, { useEffect } from "react";
import ThemePanel from "./ThemePanel";
import { Dialog } from "../../atoms/shadcn";

const meta: Meta<typeof ThemePanel> = {
  title: "CMS/Page Builder/ThemePanel",
  component: ThemePanel,
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof ThemePanel>;

function StoryWithFetchStub() {
  // Provide a lightweight fetch stub to return example theme data
  useEffect(() => {
    const orig = globalThis.fetch;
    globalThis.fetch = async (
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> => {
      const u = String(input);
      if (u.includes("/cms/api/shops/") && u.endsWith("/theme")) {
        const doc = document.documentElement;
        const brand = getComputedStyle(doc)
          .getPropertyValue("--color-brand")
          .trim();
        return new Response(
          JSON.stringify({
            themeDefaults: { "color.brand": brand || "", "font.body": "Inter" },
            themeTokens: { "color.brand": brand || "", "font.body": "Inter" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return orig(input, init);
    };
    return () => {
      globalThis.fetch = orig;
    };
  }, []);

  return (
    <Dialog open>
      <ThemePanel />
    </Dialog>
  );
}

export const Basic: Story = {
  render: () => <StoryWithFetchStub />,
};
