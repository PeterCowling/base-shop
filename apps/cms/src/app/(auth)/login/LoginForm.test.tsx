import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginForm from "./LoginForm";
import { __setSignInImpl, __resetReactAuthImpls } from "next-auth/react";

jest.mock("@/components/atoms/shadcn", () => ({
  Button: (props: any) => <button {...props} />, 
  Input: (props: any) => <input {...props} />,
}));

const signInMock = jest.fn();

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
    __resetReactAuthImpls();
    __setSignInImpl((...args: any[]) => signInMock(...args));
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
