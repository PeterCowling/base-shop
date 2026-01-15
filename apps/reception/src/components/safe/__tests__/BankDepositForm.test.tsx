import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const toastMock = vi.fn();
vi.mock("../../../utils/toastUtils", () => ({
  showToast: (...args: [string, string]) => toastMock(...args),
}));

async function loadComp() {
  vi.resetModules();
  const reauthenticate = vi.fn(async (password: string) => {
    if (password === "validpass") return { success: true };
    return { success: false, error: "Invalid password" };
  });
  vi.doMock("../../../context/AuthContext", () => ({
    useAuth: () => ({
      user: { uid: "u1", email: "u@test", displayName: "User", roles: ["staff"] },
      reauthenticate,
    }),
  }));
  const mod = await import("../BankDepositForm");
  return { default: mod.default, reauthenticate };
}

describe("BankDepositForm", () => {
  it("submits amount with keycard data", async () => {
    const { default: Comp } = await loadComp();
    const onConfirm = vi.fn();
    render(
      <Comp currentKeycards={1} onConfirm={onConfirm} onCancel={vi.fn()} />
    );

    await userEvent.type(screen.getByLabelText(/Amount/i), "25");
    await userEvent.type(screen.getByLabelText(/Keycards Deposited/i), "1");

    // Enter password
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    await userEvent.type(passwordInput, "validpass");
    const submitButton = screen.getByRole("button", { name: /Deposit/i });
    await userEvent.click(submitButton);

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith(25, 2, 1)
    );
  });

  it("doesn't submit zero amount", async () => {
    const { default: Comp } = await loadComp();
    const onConfirm = vi.fn();
    render(
      <Comp currentKeycards={0} onConfirm={onConfirm} onCancel={vi.fn()} />
    );

    await userEvent.type(screen.getByLabelText(/Amount/i), "0");

    // Enter password
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    await userEvent.type(passwordInput, "validpass");
    const submitButton = screen.getByRole("button", { name: /Deposit/i });
    await userEvent.click(submitButton);

    await waitFor(() => expect(onConfirm).not.toHaveBeenCalled());
    expect(toastMock).toHaveBeenCalled();
  });

  it("applies dark mode styles", async () => {
    const { default: Comp } = await loadComp();
    render(
      <div className="dark">
        <Comp
          currentKeycards={0}
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        />
      </div>
    );
    const heading = screen.getByRole("heading", { name: /bank deposit/i });
    const container = heading.parentElement as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
  });
});
