import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import MenuBar from "../MenuBar";

interface ChainObj {
  focus: jest.Mock;
  toggleBold: jest.Mock;
  toggleItalic: jest.Mock;
  toggleHeading: jest.Mock;
  toggleBulletList: jest.Mock;
  toggleOrderedList: jest.Mock;
  toggleBlockquote: jest.Mock;
  toggleCode: jest.Mock;
  extendMarkRange: jest.Mock;
  setLink: jest.Mock;
  unsetLink: jest.Mock;
  run: jest.Mock;
}

function makeEditor(overrides: Record<string, unknown> = {}): { editor: Record<string, unknown>; chainObj: ChainObj; run: jest.Mock } {
  const run = jest.fn();
  const chainObj: ChainObj = {
    focus: jest.fn(function (this: void) { return chainObj; }),
    toggleBold: jest.fn(function (this: void) { return chainObj; }),
    toggleItalic: jest.fn(function (this: void) { return chainObj; }),
    toggleHeading: jest.fn(function (this: void) { return chainObj; }),
    toggleBulletList: jest.fn(function (this: void) { return chainObj; }),
    toggleOrderedList: jest.fn(function (this: void) { return chainObj; }),
    toggleBlockquote: jest.fn(function (this: void) { return chainObj; }),
    toggleCode: jest.fn(function (this: void) { return chainObj; }),
    extendMarkRange: jest.fn(function (this: void) { return chainObj; }),
    setLink: jest.fn(function (this: void) { return chainObj; }),
    unsetLink: jest.fn(function (this: void) { return chainObj; }),
    run,
  };
  const editor = {
    isActive: jest.fn().mockReturnValue(false),
    getAttributes: jest.fn().mockReturnValue({ href: "" }),
    chain: jest.fn(() => chainObj),
    state: { selection: { from: 0, to: 0 } },
    ...overrides,
  };
  return { editor, chainObj, run };
}

describe("MenuBar", () => {
  it("toggles bold via chain and run", () => {
    const { editor, chainObj, run } = makeEditor();
    render(<MenuBar editor={editor as any} />);
    fireEvent.click(screen.getByRole("button", { name: "B" }));
    expect(editor.chain).toHaveBeenCalled();
    expect(chainObj.focus).toHaveBeenCalled();
    expect(chainObj.toggleBold).toHaveBeenCalled();
    expect(run).toHaveBeenCalled();
  });

  it("opens link modal and saves a valid link", () => {
    const { editor, chainObj } = makeEditor();
    render(<MenuBar editor={editor as any} />);
    fireEvent.click(screen.getByRole("button", { name: "Link" }));
    const input = screen.getByPlaceholderText("https://example.com or /page");
    fireEvent.change(input, { target: { value: "/foo" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(chainObj.extendMarkRange).toHaveBeenCalledWith("link");
    expect(chainObj.setLink).toHaveBeenCalledWith({ href: "/foo" });
  });

  it("shows Unlink and calls unsetLink when active", () => {
    const { editor, chainObj } = makeEditor({
      isActive: jest.fn().mockImplementation((name: string) => name === "link"),
    });
    render(<MenuBar editor={editor as any} />);
    // Ensure unlink button visible
    const unlink = screen.getByRole("button", { name: "Unlink" });
    fireEvent.click(unlink);
    expect(chainObj.unsetLink).toHaveBeenCalled();
  });

  it("displays Pick Internal button inside modal", () => {
    const { editor } = makeEditor();
    render(<MenuBar editor={editor as any} />);
    fireEvent.click(screen.getByRole("button", { name: "Link" }));
    expect(screen.getByRole("button", { name: "Pick Internal" })).toBeInTheDocument();
  });
});

