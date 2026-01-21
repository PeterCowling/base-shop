import React, { useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import MfaSetup from "./MfaSetup";

const meta: Meta<typeof MfaSetup> = {
  title: "Account/MfaSetup",
  component: MfaSetup,
  decorators: [
    (Story) => {
      useEffect(() => {
        const originalFetch = global.fetch;
        global.fetch = async (input: RequestInfo | URL) => {
          const url = input.toString();
          if (url.includes("/api/mfa/enroll")) {
            return new Response(JSON.stringify({ secret: "ABC123", otpauth: "otpauth://totp/demo?secret=ABC123" }), { status: 200 });
          }
          if (url.includes("/api/mfa/verify")) {
            return new Response(JSON.stringify({ verified: true }), { status: 200 });
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
type Story = StoryObj<typeof MfaSetup>;

export const Default: Story = {};
