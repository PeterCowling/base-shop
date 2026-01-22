import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { timingSafeEqual } from "crypto";

import { showToast } from "../../../utils/toastUtils";
import ReturnKeycardsModal from "../ReturnKeycardsModal";

jest.mock("../../../utils/toastUtils", () => ({ showToast: jest.fn() }));
const showToastMock = showToast as unknown as jest.Mock;

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
    user: { uid: "u1", email: "e@test", displayName: "u", roles: ["staff"] },
    reauthenticate: mockReauthenticate,
  }),
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe("ReturnKeycardsModal", () => {
  beforeEach(() => {
    mockReauthenticate.mockClear();
    mockReauthenticate.mockImplementation(async (password: string) => {
      if (isValidPassword(password)) return { success: true };
      return { success: false, error: "Invalid password" };
    });
  });

  it("calls onConfirm with a valid number and password", async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    render(<ReturnKeycardsModal onConfirm={onConfirm} onCancel={jest.fn()} />);

    await userEvent.type(screen.getByRole("spinbutton"), "2");

    // Enter password
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    await userEvent.type(passwordInput, "validpass");
    const submitButton = screen.getByRole("button", { name: /Return Keycards/i });
    await userEvent.click(submitButton);

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(2));
  });

  it("shows an error for invalid count", async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    render(<ReturnKeycardsModal onConfirm={onConfirm} onCancel={jest.fn()} />);

    const count = screen.getByRole("spinbutton");
    await userEvent.type(count, "0");

    // Enter password
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    await userEvent.type(passwordInput, "validpass");
    const submitButton = screen.getByRole("button", { name: /Return Keycards/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onConfirm).not.toHaveBeenCalled();
    });
    expect(showToastMock).toHaveBeenCalledWith(
      "Count must be a positive integer",
      "error",
    );
  });

  it("blocks submission with incorrect password", async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined);
    render(<ReturnKeycardsModal onConfirm={onConfirm} onCancel={jest.fn()} />);

    const count = screen.getByRole("spinbutton");
    await userEvent.type(count, "4");

    // Enter wrong password
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    await userEvent.type(passwordInput, "wrongpass");
    const submitButton = screen.getByRole("button", { name: /Return Keycards/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Invalid password/i);
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("calls onCancel when close clicked", async () => {
    const onCancel = jest.fn();
    render(<ReturnKeycardsModal onConfirm={jest.fn().mockResolvedValue(undefined)} onCancel={onCancel} />);

    await userEvent.click(screen.getByRole("button", { name: /close/i }));

    expect(onCancel).toHaveBeenCalled();
  });
});
