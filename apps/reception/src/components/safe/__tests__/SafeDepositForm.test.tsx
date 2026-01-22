import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { timingSafeEqual } from "crypto";

import SafeDepositForm from "../SafeDepositForm";

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
const mockReauthenticate = jest.fn();
jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "u1", email: "u@test", displayName: "User", roles: ["staff"] },
    reauthenticate: mockReauthenticate,
  }),
}));

describe("SafeDepositForm", () => {
  beforeEach(() => {
    mockReauthenticate.mockClear();
    mockReauthenticate.mockImplementation(async (password: string) => {
      if (isValidPassword(password)) return { success: true };
      return { success: false, error: "Invalid password" };
    });
  });

  it("submits counts with valid password", async () => {
    const onConfirm = jest.fn();
    render(
      <SafeDepositForm
        currentKeycards={2}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText(/€50 notes/i);
    await userEvent.type(input, "2");
    const keyInput = screen.getByLabelText(/Keycards Deposited/i);
    await userEvent.clear(keyInput);
    await userEvent.type(keyInput, "3");

    // Enter password in the PasswordReauthInline form
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    await userEvent.type(passwordInput, "validpass");
    const submitButton = screen.getByRole("button", { name: /Deposit/i });
    await userEvent.click(submitButton);

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith(100, 5, 3, { "50": 2 })
    );
  });

  it("blocks submission with incorrect password", async () => {
    const onConfirm = jest.fn();
    render(
      <SafeDepositForm
        currentKeycards={0}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText(/€50 notes/i);
    await userEvent.type(input, "2");

    // Enter wrong password
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    await userEvent.type(passwordInput, "wrongpass");
    const submitButton = screen.getByRole("button", { name: /Deposit/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Invalid password/i);
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("applies dark mode styles", async () => {
    render(
      <div className="dark">
        <SafeDepositForm
          currentKeycards={0}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      </div>
    );
    const heading = screen.getByRole("heading", { name: /deposit cash/i });
    const container = heading.parentElement as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
  });
});
