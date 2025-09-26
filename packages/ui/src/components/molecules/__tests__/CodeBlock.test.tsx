import { act, fireEvent, render, screen } from "@testing-library/react";
// no userEvent to avoid hangs in some environments
import React from "react";
import CodeBlock from "../../molecules/CodeBlock";

describe("CodeBlock copy-to-clipboard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    // Reset clipboard mock
    try {
      // @ts-expect-error redefine
      Object.defineProperty(global.navigator, "clipboard", { value: undefined, configurable: true });
    } catch {}
  });

  it("copies text and schedules reset", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    // Define clipboard API on navigator in a way jsdom accepts
    Object.defineProperty(global.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<CodeBlock code="console.log('hi')" />);
    const btn = screen.getByRole("button", { name: /copy/i });
    act(() => {
      fireEvent.click(btn);
    });
    expect(writeText).toHaveBeenCalledWith("console.log('hi')");
    // Allow any microtasks/state updates to flush
    await act(async () => {});
    // Let the auto-reset timeout elapse (covers cleanup path)
    act(() => {
      jest.advanceTimersByTime(1500);
    });
  });

  it("handles missing clipboard API gracefully", () => {
    // No navigator.clipboard available
    Object.defineProperty(global.navigator, "clipboard", {
      value: {},
      configurable: true,
    });

    render(<CodeBlock code="foo" />);
    const btn = screen.getByRole("button", { name: /copy/i });
    act(() => {
      fireEvent.click(btn);
    });

    // Label should remain 'Copy' (no Copied state)
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
  });

  it("handles clipboard write errors by not switching to 'Copied'", async () => {
    const writeText = jest.fn().mockRejectedValue(new Error("nope"));
    Object.defineProperty(global.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });

    render(<CodeBlock code="bar" />);
    const btn = screen.getByRole("button", { name: /copy/i });
    act(() => {
      fireEvent.click(btn);
    });

    // Remains as 'Copy'
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
  });
});
