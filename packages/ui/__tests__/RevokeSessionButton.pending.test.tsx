import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import RevokeSessionButton from "../src/components/account/RevokeSessionButton";

const refreshMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

describe("RevokeSessionButton pending state", () => {
  beforeEach(() => {
    refreshMock.mockClear();
  });

  it("shows 'Revoking…' while transition is pending", async () => {
    // Use a manually controlled promise so we can resolve inside act()
    let resolve!: (v: { success: boolean }) => void;
    const revoke = jest.fn(() =>
      new Promise<{ success: boolean }>((r) => {
        resolve = r;
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
