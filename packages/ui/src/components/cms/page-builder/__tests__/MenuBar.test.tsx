import { render, fireEvent, screen } from "@testing-library/react";
import React from "react";
import MenuBar from "../MenuBar";

function makeEditor(overrides: Partial<any> = {}) {
  const run = jest.fn();
  const chainObj = {
    focus: jest.fn(() => chainObj),
    toggleBold: jest.fn(() => chainObj),
    toggleItalic: jest.fn(() => chainObj),
    toggleHeading: jest.fn(() => chainObj),
    toggleBulletList: jest.fn(() => chainObj),
    toggleOrderedList: jest.fn(() => chainObj),
    toggleBlockquote: jest.fn(() => chainObj),
    toggleCode: jest.fn(() => chainObj),
    extendMarkRange: jest.fn(() => chainObj),
    setLink: jest.fn(() => chainObj),
    unsetLink: jest.fn(() => chainObj),
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

