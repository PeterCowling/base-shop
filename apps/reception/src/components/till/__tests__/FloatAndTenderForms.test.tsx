import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const toastMock = vi.fn();
vi.mock("../../../utils/toastUtils", () => ({
  showToast: (...args: [string, string]) => toastMock(...args),
}));

async function loadFloat() {
  vi.resetModules();
  const env = import.meta.env as Record<string, string | undefined>;
  env.VITE_USERS_JSON = JSON.stringify({ "111111": { email: "e", user_name: "u" } });
  const mod = await import("../FloatEntryModal");
  const { AuthProvider } = await import("../../../context/AuthContext");
  delete env.VITE_USERS_JSON;
  return { Comp: mod.default, AuthProvider };
}

async function loadRemoval() {
  vi.resetModules();
  const env = import.meta.env as Record<string, string | undefined>;
  env.VITE_USERS_JSON = JSON.stringify({ "111111": { email: "e", user_name: "u" } });
  const mod = await import("../TenderRemovalModal");
  const { AuthProvider } = await import("../../../context/AuthContext");
  delete env.VITE_USERS_JSON;
  return { Comp: mod.default, AuthProvider };
}

describe("FloatEntryModal", () => {
  it("confirms amount without approvals", async () => {
    const { Comp, AuthProvider } = await loadFloat();
    const onConfirm = vi.fn();
    render(
      <AuthProvider>
        <Comp onConfirm={onConfirm} onClose={vi.fn()} />
      </AuthProvider>
    );

    await userEvent.type(screen.getByPlaceholderText("Amount"), "60");
    const inputs = screen.getAllByLabelText(/PIN digit/);
    for (const input of inputs) {
      await userEvent.type(input, "1");
    }

    expect(onConfirm).toHaveBeenCalledWith(60);
  });

  it("ignores zero and non-numeric amounts", async () => {
    const { Comp, AuthProvider } = await loadFloat();
    const onConfirm = vi.fn();
    render(
      <AuthProvider>
        <Comp onConfirm={onConfirm} onClose={vi.fn()} />
      </AuthProvider>
    );

    const input = screen.getByPlaceholderText("Amount");

    await userEvent.type(input, "0");
    const inputs = screen.getAllByLabelText(/PIN digit/);
    for (const i of inputs) {
      await userEvent.type(i, "1");
    }
    expect(onConfirm).not.toHaveBeenCalled();

    await userEvent.clear(input);
    await userEvent.type(input, "bad");
    const inputs2 = screen.getAllByLabelText(/PIN digit/);
    for (const i of inputs2) {
      await userEvent.type(i, "1");
    }
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("does not include a comment input", async () => {
    const { Comp, AuthProvider } = await loadFloat();
    render(
      <AuthProvider>
        <Comp onConfirm={vi.fn()} onClose={vi.fn()} />
      </AuthProvider>
    );
    expect(screen.queryByPlaceholderText("Comment (optional)")).not.toBeInTheDocument();
  });

  it("applies dark mode styles", async () => {
    const { Comp, AuthProvider } = await loadFloat();
    document.documentElement.classList.add("dark");
    render(
      <AuthProvider>
        <Comp onConfirm={vi.fn()} onClose={vi.fn()} />
      </AuthProvider>
    );
    const heading = screen.getByRole("heading", { name: /add change/i });
    const container = heading.closest("div.relative") as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
    document.documentElement.classList.remove("dark");
  });

  it("invokes onClose when close button clicked", async () => {
    const { Comp, AuthProvider } = await loadFloat();
    const onClose = vi.fn();
    render(
      <AuthProvider>
        <Comp onConfirm={vi.fn()} onClose={onClose} />
      </AuthProvider>
    );
    await userEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});

describe("TenderRemovalModal", () => {
  it("auto adjusts destination", async () => {
    const { Comp, AuthProvider } = await loadRemoval();
    const onConfirm = vi.fn();
    render(
      <AuthProvider>
        <Comp onConfirm={onConfirm} onClose={vi.fn()} />
      </AuthProvider>
    );

    const typeSel = screen.getByDisplayValue("Safe Drop");
    await userEvent.selectOptions(typeSel, "BANK_DROP");
    const destSel = screen.getByDisplayValue("Bank");
    expect(destSel).toBeInTheDocument();

    await userEvent.selectOptions(typeSel, "LIFT");
    expect(screen.getByDisplayValue("Safe")).toBeInTheDocument();
  });

  it("confirms removal without approvals", async () => {
    const { Comp, AuthProvider } = await loadRemoval();
    const onConfirm = vi.fn();
    render(
      <AuthProvider>
        <Comp onConfirm={onConfirm} onClose={vi.fn()} />
      </AuthProvider>
    );

    await userEvent.type(screen.getByPlaceholderText("Amount"), "100");
    const inputs = screen.getAllByLabelText(/PIN digit/);
    for (const input of inputs) {
      await userEvent.type(input, "1");
    }

    expect(onConfirm).toHaveBeenCalledWith({
      amount: 100,
      removalType: "SAFE_DROP",
      destination: "SAFE",
    });
  });

  it("blocks confirmation when removal data invalid", async () => {
    const { Comp, AuthProvider } = await loadRemoval();
    const onConfirm = vi.fn();
    toastMock.mockReset();
    render(
      <AuthProvider>
        <Comp onConfirm={onConfirm} onClose={vi.fn()} />
      </AuthProvider>
    );

    await userEvent.type(screen.getByPlaceholderText("Amount"), "0");
    const inputs = screen.getAllByLabelText(/PIN digit/);
    for (const input of inputs) {
      await userEvent.type(input, "1");
    }

    await waitFor(() => {
      expect(onConfirm).not.toHaveBeenCalled();
    });
    expect(toastMock).toHaveBeenCalled();
  });

  it("applies dark mode styles", async () => {
    const { Comp, AuthProvider } = await loadRemoval();
    document.documentElement.classList.add("dark");
    render(
      <AuthProvider>
        <Comp onConfirm={vi.fn()} onClose={vi.fn()} />
      </AuthProvider>
    );
    const heading = screen.getByRole("heading", { name: /remove cash/i });
    const container = heading.closest("div.relative") as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
    document.documentElement.classList.remove("dark");
  });
});
