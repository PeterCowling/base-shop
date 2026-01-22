import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

async function loadComp() {
  jest.resetModules();
  const getUserByPin = jest.fn((pin: string) => {
    if (pin === "111111") return { user_name: "alice", email: "a@test" };
    if (pin === "222222") return { user_name: "bob", email: "b@test" };
    return null;
  });
  jest.doMock("../../../utils/getUserByPin", () => ({ getUserByPin }));
  jest.doMock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: { user_name: "alice", email: "a@test" } }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }));
  const mod = await import("../SafeReconcileForm");
  const { AuthProvider } = await import("../../../context/AuthContext");
  return { Comp: mod.default, AuthProvider, getUserByPin };
}

async function loadCompBlind() {
  jest.resetModules();
  const env = import.meta.env as Record<string, string | undefined>;
  env.VITE_BLIND_CLOSE = "true";
  const getUserByPin = jest.fn((pin: string) => {
    if (pin === "111111") return { user_name: "alice", email: "a@test" };
    if (pin === "222222") return { user_name: "bob", email: "b@test" };
    return null;
  });
  jest.doMock("../../../utils/getUserByPin", () => ({ getUserByPin }));
  jest.doMock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: { user_name: "alice", email: "a@test" } }),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  }));
  const mod = await import("../SafeReconcileForm");
  const { AuthProvider } = await import("../../../context/AuthContext");
  delete env.VITE_BLIND_CLOSE;
  return { Comp: mod.default, AuthProvider, getUserByPin };
}

describe("SafeReconcileForm", () => {
  it("computes breakdown and calls confirm", async () => {
    const { Comp, AuthProvider } = await loadComp();
    const onConfirm = jest.fn();
    render(
      <AuthProvider>
        <Comp
          expectedSafe={100}
          expectedKeycards={1}
          onConfirm={onConfirm}
          onCancel={jest.fn()}
        />
      </AuthProvider>
    );

    const input = screen.getByLabelText(/€50 notes/);
    await userEvent.type(input, "2");
    const cardInput = screen.getByLabelText(/keycards counted/i);
    await userEvent.type(cardInput, "1");

    const digits = screen.getAllByLabelText(/PIN digit/);
    for (const d of digits) {
      await userEvent.type(d, "1");
    }

    expect(onConfirm).toHaveBeenCalledWith(
      100,
      0,
      1,
      0,
      { "50": 2 }
    );
  });

  it("reveals expected cash when blind close is enabled", async () => {
    const { Comp, AuthProvider } = await loadCompBlind();
    render(
      <AuthProvider>
        <Comp
          expectedSafe={100}
          expectedKeycards={0}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      </AuthProvider>
    );

    expect(screen.queryByText(/Expected cash:/)).not.toBeInTheDocument();

    const input = screen.getByLabelText(/€50 notes/);
    await userEvent.type(input, "2");

    expect(screen.getByText(/Expected cash: €100.00/)).toBeInTheDocument();
    // Difference badge no longer includes the currency symbol
    // Multiple difference badges are shown (cash and keycards),
    // so verify at least one matches the expected format
    expect(screen.getAllByText(/\+\s*0/).length).toBeGreaterThan(0);
  });

  it("applies dark mode styles", async () => {
    const { Comp, AuthProvider } = await loadComp();
    render(
      <div className="dark">
        <AuthProvider>
          <Comp
            expectedSafe={100}
            expectedKeycards={0}
            onConfirm={jest.fn()}
            onCancel={jest.fn()}
          />
        </AuthProvider>
      </div>
    );
    const heading = screen.getByRole("heading", { name: /reconcile safe/i });
    const container = heading.closest("div.relative") as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
    const digits = screen.getAllByLabelText(/PIN digit/);
    expect(digits[0]).toHaveClass("bg-gray-200", { exact: false });
  });
});
