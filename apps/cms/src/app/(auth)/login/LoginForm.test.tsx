import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginForm from "./LoginForm";

jest.mock("@/components/atoms/shadcn", () => ({
  Button: (props: any) => <button {...props} />, 
  Input: (props: any) => <input {...props} />,
}));

const signInMock = jest.fn();
jest.mock("next-auth/react", () => ({
  signIn: (...args: any[]) => signInMock(...args),
}));

const pushMock = jest.fn();
const getMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () => ({ get: getMock }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    signInMock.mockReset();
    pushMock.mockReset();
    getMock.mockReset();
  });

  it("sanitizes inputs and redirects on successful sign in", async () => {
    getMock.mockReturnValue("https://evil.com/dashboard");
    signInMock.mockResolvedValue({ ok: true });
    render(<LoginForm fallbackUrl="/fallback" />);

    fireEvent.change(screen.getByPlaceholderText("admin@example.com"), {
      target: { value: " user@example.com " },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "secret" },
    });

    fireEvent.click(screen.getByText(/continue/i));

    await waitFor(() => expect(signInMock).toHaveBeenCalled());

    expect(signInMock).toHaveBeenCalledWith("credentials", {
      redirect: false,
      email: "user@example.com",
      password: "secret",
      callbackUrl: "http://localhost/dashboard",
    });

    expect(pushMock).toHaveBeenCalledWith("https://evil.com/dashboard");
  });

  it("shows error message when sign in fails", async () => {
    getMock.mockReturnValue("/account");
    signInMock.mockResolvedValue({ ok: false, error: "Bad credentials" });

    render(<LoginForm fallbackUrl="/fallback" />);

    fireEvent.change(screen.getByPlaceholderText("admin@example.com"), {
      target: { value: "foo@bar.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "secret" },
    });

    fireEvent.click(screen.getByText(/continue/i));

    await waitFor(() => expect(signInMock).toHaveBeenCalled());

    expect(pushMock).not.toHaveBeenCalled();
    await screen.findByText("Bad credentials");
  });
});
