import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import LayoutPanel from "../LayoutPanel";

jest.mock("../../../../atoms/shadcn", () => {
  let id = 0;
  return {
    __esModule: true,
    Button: (p: any) => <button {...p} />,
    Input: ({ label, ...p }: any) => {
      const inputId = `in-${id++}`;
      return (
        <div>
          {label && <label htmlFor={inputId}>{label}</label>}
          <input id={inputId} {...p} />
        </div>
      );
    },
    Select: ({ children }: any) => <div>{children}</div>,
    SelectContent: ({ children }: any) => <>{children}</>,
    SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  };
});

jest.mock("../../../../atoms", () => ({
  __esModule: true,
  Tooltip: ({ children }: any) => <span>{children}</span>,
}));

describe("LayoutPanel", () => {
  const handlers = {
    handleInput: jest.fn(),
    handleResize: jest.fn(),
    handleFullSize: jest.fn(),
  };

  beforeAll(() => {
    (globalThis as any).CSS = { supports: () => true };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("shows absolute position controls", () => {
    render(
      <LayoutPanel
        component={{ id: "a", type: "Box", position: "absolute" } as any}
        {...handlers}
      />
    );
    expect(screen.getByLabelText(/Top/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Left/)).toBeInTheDocument();
  });

  test("hides absolute controls when not absolute", () => {
    render(
      <LayoutPanel component={{ id: "a", type: "Box" } as any} {...handlers} />
    );
    expect(screen.queryByLabelText(/Top/)).toBeNull();
    expect(screen.queryByLabelText(/Left/)).toBeNull();
  });

  test("invalid width shows css error", () => {
    const original = (globalThis as any).CSS.supports;
    (globalThis as any).CSS.supports = () => false;
    render(
      <LayoutPanel
        component={{ id: "a", type: "Box", widthDesktop: "bad" } as any}
        {...handlers}
      />
    );
    expect(screen.getByLabelText(/Width \(Desktop\)/).getAttribute("error")).toBe(
      "Invalid width value"
    );
    (globalThis as any).CSS.supports = original;
  });

  test("changes to layout fields trigger handlers", () => {
    render(
      <LayoutPanel component={{ id: "a", type: "Box" } as any} {...handlers} />
    );
    const vps = ["Desktop", "Tablet", "Mobile"] as const;
    vps.forEach((vp) => {
      fireEvent.change(screen.getByLabelText(new RegExp(`Width \\(${vp}\\)`)), {
        target: { value: `${vp}-w` },
      });
      fireEvent.change(screen.getByLabelText(new RegExp(`Height \\(${vp}\\)`)), {
        target: { value: `${vp}-h` },
      });
      fireEvent.change(screen.getByLabelText(new RegExp(`Margin \\(${vp}\\)`)), {
        target: { value: `${vp}-m` },
      });
      fireEvent.change(screen.getByLabelText(new RegExp(`Padding \\(${vp}\\)`)), {
        target: { value: `${vp}-p` },
      });
    });
    const marginInputs = screen.getAllByLabelText(/Margin/);
    fireEvent.change(marginInputs[marginInputs.length - 1], {
      target: { value: "global-m" },
    });
    const paddingInputs = screen.getAllByLabelText(/Padding/);
    fireEvent.change(paddingInputs[paddingInputs.length - 1], {
      target: { value: "global-p" },
    });
    vps.forEach((vp) => {
      expect(handlers.handleResize).toHaveBeenCalledWith(
        `width${vp}`,
        `${vp}-w`
      );
      expect(handlers.handleResize).toHaveBeenCalledWith(
        `height${vp}`,
        `${vp}-h`
      );
      expect(handlers.handleResize).toHaveBeenCalledWith(
        `margin${vp}`,
        `${vp}-m`
      );
      expect(handlers.handleResize).toHaveBeenCalledWith(
        `padding${vp}`,
        `${vp}-p`
      );
    });
    expect(handlers.handleInput).toHaveBeenCalledWith("margin", "global-m");
    expect(handlers.handleInput).toHaveBeenCalledWith("padding", "global-p");
  });

  test("full size buttons trigger handler for all viewports", () => {
    render(
      <LayoutPanel component={{ id: "a", type: "Box" } as any} {...handlers} />
    );
    const vps = ["Desktop", "Tablet", "Mobile"] as const;
    const widthBtns = screen.getAllByText("Full width");
    const heightBtns = screen.getAllByText("Full height");
    widthBtns.forEach((btn, i) => {
      fireEvent.click(btn);
      expect(handlers.handleFullSize).toHaveBeenNthCalledWith(
        i + 1,
        `width${vps[i]}`
      );
    });
    heightBtns.forEach((btn, i) => {
      fireEvent.click(btn);
      expect(handlers.handleFullSize).toHaveBeenNthCalledWith(
        widthBtns.length + i + 1,
        `height${vps[i]}`
      );
    });
  });

  test("absolute position updates trigger handlers and validation", () => {
    const original = (globalThis as any).CSS.supports;
    (globalThis as any).CSS.supports = (_p: string, v: string) => !v.includes("bad");
    render(
      <LayoutPanel
        component={{
          id: "a",
          type: "Box",
          position: "absolute",
          top: "bad",
          left: "bad",
        } as any}
        {...handlers}
      />
    );
    const top = screen.getByLabelText(/Top/);
    const left = screen.getByLabelText(/Left/);
    expect(top.getAttribute("error")).toBe("Invalid top value");
    expect(left.getAttribute("error")).toBe("Invalid left value");
    fireEvent.change(top, { target: { value: "10px" } });
    expect(handlers.handleResize).toHaveBeenCalledWith("top", "10px");
    fireEvent.change(left, { target: { value: "5px" } });
    expect(handlers.handleResize).toHaveBeenCalledWith("left", "5px");
    (globalThis as any).CSS.supports = original;
  });

  test("gap input validates and triggers handler", () => {
    const original = (globalThis as any).CSS.supports;
    (globalThis as any).CSS.supports = (_p: string, v: string) => v !== "bad";
    render(
      <LayoutPanel component={{ id: "a", type: "Box", gap: "bad" } as any} {...handlers} />
    );
    const gapInput = screen.getByLabelText(/Gap/);
    expect(gapInput).toBeInTheDocument();
    expect(gapInput.getAttribute("error")).toBe("Invalid gap value");
    fireEvent.change(gapInput, { target: { value: "2rem" } });
    expect(handlers.handleInput).toHaveBeenCalledWith("gap", "2rem");
    (globalThis as any).CSS.supports = original;
  });
});

