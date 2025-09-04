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

  it("invokes link command chain with prompt value", () => {
    const { editor, chain } = createEditor();
    const promptSpy = jest
      .spyOn(window, "prompt")
      .mockReturnValue("https://example.com");
    render(<MenuBar editor={editor} />);
    fireEvent.click(screen.getByRole("button", { name: "Link" }));
    expect(promptSpy).toHaveBeenCalled();
    expect(chain.focus).toHaveBeenCalled();
    expect(chain.extendMarkRange).toHaveBeenCalledWith("link");
    expect(chain.setLink).toHaveBeenCalledWith({ href: "https://example.com" });
    expect(chain.run).toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  it("renders nothing when editor is null", () => {
    const { container } = render(<MenuBar editor={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

