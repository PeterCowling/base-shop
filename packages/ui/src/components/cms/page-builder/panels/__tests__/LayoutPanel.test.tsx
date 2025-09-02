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

  test("renders gap input when component has gap", () => {
    render(
      <LayoutPanel component={{ id: "a", type: "Box", gap: "1rem" } as any} {...handlers} />
    );
    expect(screen.getByLabelText(/Gap/)).toBeInTheDocument();
  });

  test("full width button triggers handler", () => {
    render(
      <LayoutPanel component={{ id: "a", type: "Box" } as any} {...handlers} />
    );
    fireEvent.click(screen.getAllByText("Full width")[0]);
    expect(handlers.handleFullSize).toHaveBeenCalledWith("widthDesktop");
  });
});

