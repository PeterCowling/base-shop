import React, { useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import RevokeSessionButton from "./RevokeSessionButton";

const meta: Meta<typeof RevokeSessionButton> = {
  title: "Account/RevokeSessionButton",
  component: RevokeSessionButton,
  args: {
    sessionId: "session-123",
  },
  decorators: [
    (Story) => {
      useEffect(() => {
        const originalFetch = global.fetch;
        global.fetch = async () =>
          new Response(JSON.stringify({ success: true }), { status: 200 });
        return () => {
          global.fetch = originalFetch;
        };
      }, []);
      return <Story />;
    },
  ],
};

export default meta;
type Story = StoryObj<typeof RevokeSessionButton>;

export const Default: Story = {};
