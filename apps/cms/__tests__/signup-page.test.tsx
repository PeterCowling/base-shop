// apps/cms/__tests__/signup-page.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockRequestAccount = jest.fn().mockResolvedValue(undefined);
const redirectMock = jest.fn();

jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Input: (props: any) => <input {...props} />,
  };
}, { virtual: true });

jest.mock("@cms/actions/accounts.server", () => ({
  __esModule: true,
  requestAccount: mockRequestAccount,
}));

jest.mock("next/navigation", () => ({ redirect: redirectMock }));

const SignupPage = require("../src/app/(auth)/signup/page").default;

describe("SignupPage", () => {
  afterEach(() => {
    mockRequestAccount.mockClear();
    redirectMock.mockClear();
  });

  it("submits form and redirects to login", async () => {
    const user = userEvent.setup();
    const element = SignupPage();
    const action = (element.props as any).action as (fd: FormData) => Promise<void>;
    render(element);

    await user.type(screen.getByPlaceholderText(/name/i), "Alice");
    await user.type(screen.getByPlaceholderText(/email/i), "alice@example.com");
    await user.type(screen.getByPlaceholderText(/password/i), "secret");

    const fd = new FormData();
    fd.append("name", (screen.getByPlaceholderText(/name/i) as HTMLInputElement).value);
    fd.append(
      "email",
      (screen.getByPlaceholderText(/email/i) as HTMLInputElement).value,
    );
    fd.append(
      "password",
      (screen.getByPlaceholderText(/password/i) as HTMLInputElement).value,
    );

    await action(fd);

    expect(mockRequestAccount).toHaveBeenCalledWith(fd);
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});

