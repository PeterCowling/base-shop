import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { timingSafeEqual } from "crypto";

import { SafeOpenForm } from "../SafeOpenForm";

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

describe("SafeOpenForm", () => {
  beforeEach(() => {
    mockReauthenticate.mockClear();
    mockReauthenticate.mockImplementation(async (password: string) => {
      if (isValidPassword(password)) return { success: true };
      return { success: false, error: "Invalid password" };
    });
  });

  it("submits opening count", async () => {
    const onConfirm = jest.fn();
    render(<SafeOpenForm onConfirm={onConfirm} onCancel={jest.fn()} />);

    await userEvent.type(screen.getByPlaceholderText(/opening count/i), "100");
    await userEvent.type(screen.getByPlaceholderText(/opening keycards/i), "5");
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    await userEvent.type(passwordInput, "validpass");
    await userEvent.click(
      screen.getByRole("button", { name: /confirm opening/i })
    );

    expect(onConfirm).toHaveBeenCalledWith(100, 5);
  });

  it("applies dark mode styles", () => {
    render(
      <div className="dark">
        <SafeOpenForm onConfirm={jest.fn()} onCancel={jest.fn()} />
      </div>
    );
    const heading = screen.getByRole("heading", { name: /open safe/i });
    const container = heading.parentElement as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
    expect(screen.getByRole("button", { name: /confirm opening/i })).toHaveClass(
      "dark:bg-darkAccentGreen"
    );
  });
});
