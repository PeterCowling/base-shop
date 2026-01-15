import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { timingSafeEqual } from "crypto";
import { describe, expect, it, vi } from "vitest";

// Static mock for AuthContext
const validPassword = "validpass";
const isValidPassword = (password: string) => {
  if (password.length !== validPassword.length) {
    return false;
  }
  return timingSafeEqual(
    Buffer.from(password, "utf8"),
    Buffer.from(validPassword, "utf8")
  );
};
const mockReauthenticate = vi.fn();
vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "u1", email: "t@test", displayName: "tester", roles: ["staff"] },
    reauthenticate: mockReauthenticate,
  }),
}));

import SafeWithdrawalForm from "../SafeWithdrawalForm";

describe("SafeWithdrawalForm", () => {
  beforeEach(() => {
    mockReauthenticate.mockClear();
    mockReauthenticate.mockImplementation(async (password: string) => {
      if (isValidPassword(password)) return { success: true };
      return { success: false, error: "Invalid password" };
    });
  });

  it("confirms withdrawal with valid password", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<SafeWithdrawalForm onConfirm={onConfirm} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByLabelText("€10 notes"), "2");

    // Enter password
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    await userEvent.type(passwordInput, "validpass");
    const submitButton = screen.getByRole("button", { name: /Withdraw/i });
    await userEvent.click(submitButton);

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith(20, { "10": 2 })
    );
  });

  it("blocks confirmation with incorrect password", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(<SafeWithdrawalForm onConfirm={onConfirm} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByLabelText("€10 notes"), "2");

    // Enter wrong password
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    await userEvent.type(passwordInput, "wrongpass");
    const submitButton = screen.getByRole("button", { name: /Withdraw/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Invalid password/i);
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("applies dark mode styles", async () => {
    render(
      <div className="dark">
        <SafeWithdrawalForm onConfirm={vi.fn().mockResolvedValue(undefined)} onCancel={vi.fn()} />
      </div>
    );
    const heading = screen.getByRole("heading", { name: /withdraw cash/i });
    const container = heading.parentElement as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
  });

  it("displays errors from onConfirm", async () => {
    const onConfirm = vi
      .fn()
      .mockRejectedValue(new Error("Insufficient funds in safe"));
    render(<SafeWithdrawalForm onConfirm={onConfirm} onCancel={vi.fn()} />);
    await userEvent.type(screen.getByLabelText("€10 notes"), "2");

    // Enter valid password
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    await userEvent.type(passwordInput, "validpass");
    const submitButton = screen.getByRole("button", { name: /Withdraw/i });
    await userEvent.click(submitButton);

    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(await screen.findByRole("alert")).toHaveTextContent(
      /insufficient funds in safe/i,
    );
  });
});
