import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { act } from "react";
import RevokeSessionButton from "../src/components/account/RevokeSessionButton";

jest.useFakeTimers();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

describe("RevokeSessionButton disabled state", () => {
  it("disables button while revoke is pending", async () => {
    render(
      <RevokeSessionButton
        sessionId="sid"
        revoke={async () => new Promise((r) => setTimeout(() => r({ success: true }), 100))}
      />
    );
    const btn = screen.getByRole("button", { name: /revoke/i });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(btn).toBeDisabled();
    await act(async () => {
      jest.advanceTimersByTime(120);
    });
  });
});
