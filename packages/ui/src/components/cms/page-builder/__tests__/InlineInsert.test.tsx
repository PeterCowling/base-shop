import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";

import InlineInsert from "../InlineInsert";

// Lightweight mock of Popover primitives used by InlineInsert
jest.mock("../../../atoms", () => {
  const React = require("react");
  return {
    __esModule: true,
    Popover: ({ children }: any) => <div>{children}</div>,
    PopoverTrigger: ({ children }: any) => children,
    PopoverContent: ({ children, ...rest }: any) => (
      <div role="dialog" {...rest}>
        {children}
      </div>
    ),
  };
});

describe("InlineInsert", () => {
  it("opens popover and inserts selected item", () => {
    const onInsert = jest.fn();
    render(<InlineInsert index={0} onInsert={onInsert} context="top" />);

    // Open popover
    const trigger = screen.getByRole("button", { name: /insert block here/i });
    fireEvent.click(trigger);

    // Pick a top-level allowed container, e.g., Section
    const pop = screen.getByRole("dialog");
    const option = within(pop).getByRole("option", { name: /section/i });
    fireEvent.click(option);

    expect(onInsert).toHaveBeenCalledTimes(1);
    const [component, idx] = onInsert.mock.calls[0];
    expect(idx).toBe(0);
    expect(component?.type).toBeDefined();
  });

  it("supports keyboard navigation and Enter", () => {
    const onInsert = jest.fn();
    render(<InlineInsert index={2} onInsert={onInsert} />);
    const trigger = screen.getByRole("button", { name: /insert block here/i });
    fireEvent.click(trigger);
    const pop = screen.getByRole("dialog");
    // Arrow down twice and press Enter
    fireEvent.keyDown(pop, { key: "ArrowDown" });
    fireEvent.keyDown(pop, { key: "ArrowDown" });
    fireEvent.keyDown(pop, { key: "Enter" });
    expect(onInsert).toHaveBeenCalledTimes(1);
    const [, idx] = onInsert.mock.calls[0];
    expect(idx).toBe(2);
  });
});
