import React, { act } from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import RevokeSessionButton from "../src/components/account/RevokeSessionButton";

const refreshMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));
// Mock i18n so pending and idle labels resolve
jest.mock("@acme/i18n", () => ({
  useTranslations: () => (key: string) =>
    ({
      "actions.revoke": "Revoke",
      "actions.revoking": "Revoking...",
      "account.sessions.errors.revokeFailed": "Failed to revoke session.",
    } as Record<string, string>)[key] ?? key,
}));

describe("RevokeSessionButton pending state", () => {
  beforeEach(() => {
    refreshMock.mockClear();
  });

  it("shows 'Revoking…' while transition is pending", async () => {
    // Use a manually controlled promise so we can resolve inside act()
    let resolve!: (v: { success: boolean }) => void;
    const revoke = jest.fn(() =>
      new Promise<{ success: boolean }>((_resolve) => {
        resolve = _resolve;
      })
    );

    render(<RevokeSessionButton sessionId="s3" revoke={revoke} />);

    const btn = screen.getByRole("button", { name: /revoke/i });
    fireEvent.click(btn);

    // Immediately after click, pending state should render
    expect(screen.getByText(/revoking/i)).toBeInTheDocument();

    // Resolve the suspended work within act to avoid warnings
    await act(async () => {
      resolve({ success: true });
      // Ensure any queued microtasks flush
      await Promise.resolve();
    });

    // Verify we returned from pending state and triggered refresh
    expect(refreshMock).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /revoke/i })).toBeEnabled();
  });
});
