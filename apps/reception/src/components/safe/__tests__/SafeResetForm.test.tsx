import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { timingSafeEqual } from "crypto";

import { SafeResetForm } from "../SafeResetForm";

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
    user: { uid: "u1", email: "u@test", displayName: "User", roles: ["manager"] },
    reauthenticate: mockReauthenticate,
  }),
}));

describe("SafeResetForm", () => {
  beforeEach(() => {
    mockReauthenticate.mockClear();
    mockReauthenticate.mockImplementation(async (password: string) => {
      if (isValidPassword(password)) return { success: true };
      return { success: false, error: "Invalid password" };
    });
  });

  it("submits counts", async () => {
    const onConfirm = jest.fn();
    render(
      <SafeResetForm
        currentKeycards={2}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    const input = screen.getByLabelText(/€50 notes/i);
    await userEvent.type(input, "2");
    const cardInput = screen.getByLabelText(/keycards counted/i);
    await userEvent.type(cardInput, "3");
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    await userEvent.type(passwordInput, "validpass");
    await userEvent.click(screen.getByRole("button", { name: /confirm reset/i }));

    expect(onConfirm).toHaveBeenCalledWith(100, 3, 1, { "50": 2 });
  });

  it("applies dark mode styles", () => {
    render(
      <div className="dark">
        <SafeResetForm
          currentKeycards={0}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      </div>
    );
    const heading = screen.getByRole("heading", { name: /reset safe/i });
    const container = heading.parentElement as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
    expect(screen.getByRole("button", { name: /confirm reset/i })).toHaveClass(
      "dark:bg-darkAccentGreen"
    );
  });
});
