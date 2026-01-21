import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import RevokeSessionButton from "../src/components/account/RevokeSessionButton";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));
// Mock i18n to provide English strings expected by assertions
jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) =>
    ({
      "actions.revoke": "Revoke",
      "actions.revoking": "Revoking...",
      "account.sessions.errors.revokeFailed": "Failed to revoke session.",
    } as Record<string, string>)[key] ?? key,
}));

describe("RevokeSessionButton fallback error message", () => {
  it("shows default error when none provided", async () => {
    const revoke = jest.fn().mockResolvedValue({ success: false });
    render(<RevokeSessionButton sessionId="s4" revoke={revoke} />);
    fireEvent.click(screen.getByRole("button", { name: /revoke/i }));
    expect(await screen.findByText(/Failed to revoke session\./i)).toBeInTheDocument();
  });
});
