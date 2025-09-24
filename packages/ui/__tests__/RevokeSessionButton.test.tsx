import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RevokeSessionButton from "../src/components/account/RevokeSessionButton";

const refreshMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

describe("RevokeSessionButton", () => {
  beforeEach(() => {
    refreshMock.mockClear();
  });

  it("refreshes router on successful revoke", async () => {
    const revoke = jest.fn().mockResolvedValue({ success: true });
    render(<RevokeSessionButton sessionId="s1" revoke={revoke} />);

    fireEvent.click(screen.getByRole("button", { name: /revoke/i }));

    await waitFor(() => expect(revoke).toHaveBeenCalledWith("s1"));
    expect(refreshMock).toHaveBeenCalled();
    expect(screen.queryByText(/failed to revoke/i)).toBeNull();
  });

  it("shows error when revoke fails", async () => {
    const revoke = jest.fn().mockResolvedValue({ success: false, error: "Oops" });
    render(<RevokeSessionButton sessionId="s2" revoke={revoke} />);

    fireEvent.click(screen.getByRole("button", { name: /revoke/i }));

    await screen.findByText("Oops");
    expect(refreshMock).not.toHaveBeenCalled();
  });
});

