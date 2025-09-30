import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import LayoutPanel from "../LayoutPanel";

jest.mock("../../../../atoms/shadcn", () => {
  const React = require("react");
  let id = 0;
  return {
    __esModule: true,
    Button: (p: any) => <button {...p} />,
    // Drop non-DOM props (e.g., labelSuffix) so they don't leak to <input>
    Input: ({ label, labelSuffix: _labelSuffix, ...p }: any) => {
      const inputId = `in-${id++}`;
      return (
        <div>
          {label && <label htmlFor={inputId}>{label}</label>}
          <input id={inputId} {...p} />
        </div>
      );
    },
    Select: ({ children, onValueChange }: any) => (
      <div>
        {React.Children.map(children, (child: any) =>
          React.cloneElement(child, { onValueChange })
        )}
      </div>
    ),
    SelectContent: ({ children, onValueChange }: any) => (
      <div>
        {React.Children.map(children, (child: any) =>
          React.cloneElement(child, { onValueChange })
        )}
      </div>
    ),
    SelectItem: ({ children, value, onValueChange }: any) => (
      <div
        role="button"
        tabIndex={0}
        data-value={value}
        onClick={() => onValueChange(value)}
        onKeyDown={(e: any) => {
          if (e.key === "Enter" || e.key === " ") onValueChange(value);
        }}
      >
        {children}
      </div>
    ),
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
    const top = screen.getByLabelText(/Top/, { selector: 'input' });
    const left = screen.getByLabelText(/Left/, { selector: 'input' });
    expect(top).toBeInTheDocument();
    expect(left).toBeInTheDocument();
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
      fireEvent.change(
        screen.getByLabelText((content) => typeof content === "string" && content.includes(`Width (${vp})`)),
        {
          target: { value: `${vp}-w` },
        }
      );
      fireEvent.change(
        screen.getByLabelText((content) => typeof content === "string" && content.includes(`Height (${vp})`)),
        {
          target: { value: `${vp}-h` },
        }
      );
      fireEvent.change(
        screen.getByLabelText((content) => typeof content === "string" && content.includes(`Margin (${vp})`)),
        {
          target: { value: `${vp}-m` },
        }
      );
      fireEvent.change(
        screen.getByLabelText((content) => typeof content === "string" && content.includes(`Padding (${vp})`)),
        {
          target: { value: `${vp}-p` },
        }
      );
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

  test("full size buttons trigger handler for all viewports with 100%", () => {
    render(
      <LayoutPanel
        component={{ id: "a", type: "Box" } as any}
        handleInput={handlers.handleInput}
        handleResize={handlers.handleResize}
        handleFullSize={(field: string) => handlers.handleFullSize(field, "100%")} // pass through value for assertion
      />
    );
    const vps = ["Desktop", "Tablet", "Mobile"] as const;
    const widthBtns = screen.getAllByText("Full width");
    const heightBtns = screen.getAllByText("Full height");
    widthBtns.forEach((btn, i) => {
      fireEvent.click(btn);
      expect(handlers.handleFullSize).toHaveBeenNthCalledWith(
        i + 1,
        `width${vps[i]}`,
        "100%"
      );
    });
    heightBtns.forEach((btn, i) => {
      fireEvent.click(btn);
      expect(handlers.handleFullSize).toHaveBeenNthCalledWith(
        widthBtns.length + i + 1,
        `height${vps[i]}`,
        "100%"
      );
    });
  });

  test("position selection toggles absolute offsets and validates", () => {
    const original = (globalThis as any).CSS.supports;
    (globalThis as any).CSS.supports = (_p: string, v: string) => !v.includes("bad");
    const Wrapper = () => {
      const [component, setComponent] = React.useState({
        id: "a",
        type: "Box",
      } as any);
      return (
        <LayoutPanel
          component={component}
          handleInput={(field, value) => {
            setComponent((c: any) => ({ ...c, [field]: value }));
            handlers.handleInput(field, value);
          }}
          handleResize={(field, value) => {
            setComponent((c: any) => ({ ...c, [field]: value }));
            handlers.handleResize(field, value);
          }}
          handleFullSize={handlers.handleFullSize}
        />
      );
    };
    render(<Wrapper />);

    expect(screen.queryByLabelText(/Top/)).toBeNull();
    fireEvent.click(screen.getByText("absolute"));
    expect(handlers.handleInput).toHaveBeenCalledWith("position", "absolute");
    const top = screen.getByLabelText(/Top/, { selector: 'input' });
    const left = screen.getByLabelText(/Left/, { selector: 'input' });
    fireEvent.change(top, { target: { value: "bad" } });
    fireEvent.change(left, { target: { value: "bad" } });
    expect(top.getAttribute("error")).toBe("Invalid top value");
    expect(left.getAttribute("error")).toBe("Invalid left value");
    fireEvent.change(top, { target: { value: "10px" } });
    fireEvent.change(left, { target: { value: "5px" } });
    expect(handlers.handleResize).toHaveBeenCalledWith("top", "10px");
    expect(handlers.handleResize).toHaveBeenCalledWith("left", "5px");
    fireEvent.click(screen.getByText("relative"));
    expect(handlers.handleInput).toHaveBeenCalledWith("position", "relative");
    expect(screen.queryByLabelText(/Top/)).toBeNull();
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
