import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import RevokeSessionButton from "../src/components/account/RevokeSessionButton";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: jest.fn() }),
}));

describe("RevokeSessionButton fallback error message", () => {
  it("shows default error when none provided", async () => {
    const revoke = jest.fn().mockResolvedValue({ success: false });
    render(<RevokeSessionButton sessionId="s4" revoke={revoke} />);
    fireEvent.click(screen.getByRole("button", { name: /revoke/i }));
    expect(await screen.findByText(/Failed to revoke session\./i)).toBeInTheDocument();
  });
});

