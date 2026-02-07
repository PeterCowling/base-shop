import { fireEvent, render, screen } from "@testing-library/react";

import MenuBar from "../src/components/cms/page-builder/MenuBar";

describe("MenuBar", () => {
  const createEditor = () => {
    const chain = {
      focus: jest.fn().mockReturnThis(),
      toggleBold: jest.fn().mockReturnThis(),
      toggleItalic: jest.fn().mockReturnThis(),
      extendMarkRange: jest.fn().mockReturnThis(),
      setLink: jest.fn().mockReturnThis(),
      run: jest.fn().mockReturnThis(),
    };

    const editor = {
      isActive: jest.fn().mockReturnValue(false),
      chain: jest.fn(() => chain),
    } as any;

    return { editor, chain };
  };

  it("invokes bold command chain", () => {
    const { editor, chain } = createEditor();
    render(<MenuBar editor={editor} />);
    fireEvent.click(screen.getByRole("button", { name: "B" }));
    expect(editor.chain).toHaveBeenCalled();
    expect(chain.focus).toHaveBeenCalled();
    expect(chain.toggleBold).toHaveBeenCalled();
    expect(chain.run).toHaveBeenCalled();
  });

  it("invokes italic command chain", () => {
    const { editor, chain } = createEditor();
    render(<MenuBar editor={editor} />);
    fireEvent.click(screen.getByRole("button", { name: "I" }));
    expect(chain.focus).toHaveBeenCalled();
    expect(chain.toggleItalic).toHaveBeenCalled();
    expect(chain.run).toHaveBeenCalled();
  });

  it("invokes link command chain via modal with entered URL", () => {
    const { editor, chain } = createEditor();
    render(<MenuBar editor={editor} />);
    fireEvent.click(screen.getByRole("button", { name: "Link" }));
    const dialog = screen.getByRole("dialog", { name: "Insert Link" });
    const input = dialog.querySelector("input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "https://example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(chain.focus).toHaveBeenCalled();
    expect(chain.extendMarkRange).toHaveBeenCalledWith("link");
    expect(chain.setLink).toHaveBeenCalledWith({ href: "https://example.com" });
    expect(chain.run).toHaveBeenCalled();
  });

  it("renders nothing when editor is null", () => {
    const { container } = render(<MenuBar editor={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});
