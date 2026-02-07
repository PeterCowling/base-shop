import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("../../common/PasswordReauthInline", () => ({
  __esModule: true,
  default: ({ onSubmit, submitLabel }: { onSubmit: () => void; submitLabel?: string }) => (
    <button onClick={onSubmit}>{submitLabel ?? "Confirm"}</button>
  ),
}));

async function loadComp() {
  const mod = await import("../ExchangeNotesForm");
  return mod.default;
}

describe("ExchangeNotesForm", () => {
  it("calls onConfirm when totals match", async () => {
    const Comp = await loadComp();
    const onConfirm = jest.fn();
    render(<Comp onConfirm={onConfirm} onCancel={jest.fn()} />);

    // outgoing from drawer: €20 x1
    const outInput = screen.getByLabelText("€20 notes");
    await userEvent.type(outInput, "1");

    // switch to incoming from safe and enter €10 x2
    await userEvent.click(
      screen.getByRole("button", { name: /switch to safe/i })
    );
    const inInput = screen.getByLabelText("€10 notes");
    await userEvent.type(inInput, "2");

    await userEvent.click(screen.getByRole("button", { name: /confirm exchange/i }));

    expect(onConfirm).toHaveBeenCalledWith(
      { "20": 1 },
      { "10": 2 },
      "safeToDrawer",
      20
    );
  });

  it("does not allow confirmation when no counts entered", async () => {
    const Comp = await loadComp();
    const onConfirm = jest.fn();
    render(<Comp onConfirm={onConfirm} onCancel={jest.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /confirm exchange/i }));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("applies dark mode styles", async () => {
    const Comp = await loadComp();
    document.documentElement.classList.add("dark");
    render(<Comp onConfirm={jest.fn()} onCancel={jest.fn()} />);
    const heading = screen.getByRole("heading", { name: /exchange notes/i });
    const container = heading.closest("div.relative") as HTMLElement;
    expect(container).toHaveClass("dark:bg-darkSurface");
    document.documentElement.classList.remove("dark");
  });

  it("renders coin inputs", async () => {
    const Comp = await loadComp();
    render(<Comp onConfirm={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getAllByLabelText("€1 coins").length).toBe(1);
  });

  it("can flip orientation", async () => {
    const Comp = await loadComp();
    render(<Comp onConfirm={jest.fn()} onCancel={jest.fn()} />);
    expect(screen.getByRole("heading", { name: /from drawer/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /switch to safe/i }));
    expect(screen.getByRole("heading", { name: /from safe/i })).toBeInTheDocument();
  });
});
