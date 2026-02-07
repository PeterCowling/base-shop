import React, { useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import StartReturnButton from "./StartReturnButton";

const meta: Meta<typeof StartReturnButton> = {
  title: "Account/StartReturnButton",
  component: StartReturnButton,
  args: {
    sessionId: "sess-123",
  },
  decorators: [
    (Story) => {
      useEffect(() => {
        const originalFetch = global.fetch;
        global.fetch = async (input: RequestInfo | URL) => {
          const url = input.toString();
          if (url.includes("/api/return") && (typeof input === "string" ? input : url).includes("?")) {
            return new Response(JSON.stringify({ status: "in_transit" }), { status: 200 });
          }
          if (url.includes("/api/return")) {
            return new Response(JSON.stringify({
              tracking: { number: "TRK123456", labelUrl: "https://example.com/label.pdf" },
              dropOffProvider: "UPS",
            }), { status: 200 });
          }
          return originalFetch(input as any);
        };
        return () => {
          global.fetch = originalFetch;
        };
      }, []);
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof StartReturnButton>;

export const Default: Story = {};
