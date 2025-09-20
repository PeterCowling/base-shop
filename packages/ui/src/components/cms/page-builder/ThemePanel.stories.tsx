// packages/ui/src/components/cms/page-builder/ThemePanel.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import React, { useEffect } from "react";
import ThemePanel from "./ThemePanel";

const meta: Meta<typeof ThemePanel> = {
  title: "CMS/Page Builder/ThemePanel",
  component: ThemePanel,
  parameters: {
    layout: "centered",
  },
};
export default meta;

type Story = StoryObj<typeof ThemePanel>;

export const Basic: Story = {
  render: () => {
    // Provide a lightweight fetch stub to return example theme data
    useEffect(() => {
      const orig = window.fetch;
      (window as any).fetch = async (url: RequestInfo) => {
        const u = String(url);
        if (u.includes("/cms/api/shops/") && u.endsWith("/theme")) {
          return new Response(
            JSON.stringify({
              themeDefaults: { "color.brand": "#000000", "font.body": "Inter" },
              themeTokens: { "color.brand": "#0ea5e9", "font.body": "Inter" },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return orig(url as any);
      };
      return () => {
        (window as any).fetch = orig;
      };
    }, []);

    return <ThemePanel />;
  },
};

