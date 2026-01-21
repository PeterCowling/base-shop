import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const toastMock = jest.fn();
jest.mock("../../../utils/toastUtils", () => ({
  showToast: (...args: [string, string]) => toastMock(...args),
}));

async function loadComp() {
  jest.resetModules();
  const reauthenticate = jest.fn(async (password: string) => {
    if (password === "validpass") return { success: true };
    return { success: false, error: "Invalid password" };
  });
  jest.doMock("../../../context/AuthContext", () => ({
    useAuth: () => ({
      user: { uid: "u1", email: "u@test", displayName: "User", roles: ["staff"] },
      reauthenticate,
    }),
  }));
  const mod = await import("../PettyCashForm");
  return { default: mod.default, reauthenticate };
}

describe("PettyCashForm", () => {
  it("submits amount with valid password", async () => {
    const { default: Comp } = await loadComp();
    const onConfirm = jest.fn();
    render(<Comp onConfirm={onConfirm} onCancel={jest.fn()} />);

    await userEvent.type(screen.getByPlaceholderText("Amount"), "15");

    // Enter password
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    await userEvent.type(passwordInput, "validpass");
    const submitButton = screen.getByRole("button", { name: /Withdraw/i });
    await userEvent.click(submitButton);

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(15));
  });

  it("blocks confirmation when amount missing", async () => {
    const { default: Comp } = await loadComp();
    const onConfirm = jest.fn();
    render(<Comp onConfirm={onConfirm} onCancel={jest.fn()} />);

    // Enter password without amount
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    await userEvent.type(passwordInput, "validpass");
    const submitButton = screen.getByRole("button", { name: /Withdraw/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(onConfirm).not.toHaveBeenCalled();
    });
    expect(toastMock).toHaveBeenCalled();
  });

  it("applies dark mode styles", async () => {
    const { default: Comp } = await loadComp();
    render(
      <div className="dark">
        <Comp onConfirm={jest.fn()} onCancel={jest.fn()} />
      </div>
    );
    const heading = screen.getByText(/petty cash withdrawal/i);
    const container = heading.parentElement as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
  });
});
