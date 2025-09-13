import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TemplateSelector from "../TemplateSelector";

jest.mock("@/components/atoms", () => {
  const React = require("react");
  return {
    __esModule: true,
    Dialog: ({ open, children }: any) => (open ? <div>{children}</div> : null),
    DialogContent: ({ children }: any) => <div>{children}</div>,
    DialogFooter: ({ children }: any) => <div>{children}</div>,
    DialogHeader: ({ children }: any) => <div>{children}</div>,
    DialogTitle: ({ children }: any) => <div>{children}</div>,
  };
});

jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
    Select: ({ children, open, onOpenChange, onValueChange, value, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    SelectTrigger: ({ children, asChild, ...props }: any) => <div {...props}>{children}</div>,
    SelectContent: ({ children, asChild, ...props }: any) => <div {...props}>{children}</div>,
    SelectItem: ({ children, onSelect, disabled, asChild, ...props }: any) => (
      <div
        onClick={(e) => !disabled && onSelect && onSelect(e)}
        aria-disabled={disabled}
        {...props}
      >
        {children}
      </div>
    ),
    SelectValue: ({ placeholder }: any) => <div>{placeholder}</div>,
  };
});

jest.mock("next/image", () => (props: any) => <img {...props} alt={props.alt} />);

describe("TemplateSelector", () => {
  it("page navigation changes visible templates", () => {
    const pages = [
      [{ name: "One", components: [], preview: "" }],
      [{ name: "Two", components: [], preview: "" }],
    ];
    const Wrapper = () => {
      const [page, setPage] = React.useState(0);
      return (
        <div>
          <TemplateSelector value="" pageTemplates={pages[page]} onConfirm={jest.fn()} />
          <button onClick={() => setPage((p) => p + 1)}>next</button>
        </div>
      );
    };
    render(<Wrapper />);
    expect(screen.getByText("One")).toBeInTheDocument();
    fireEvent.click(screen.getByText("next"));
    expect(screen.queryByText("One")).not.toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });

  it("selecting a template triggers callback", () => {
    const onConfirm = jest.fn();
    render(
      <TemplateSelector
        value=""
        pageTemplates={[{ name: "Temp", components: [{ type: "comp" } as any], preview: "" }]}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByText("Temp"));
    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledWith(
      "Temp",
      [expect.objectContaining({ type: "comp", id: expect.any(String) })],
    );
  });

  it("disabled templates cannot be selected", () => {
    const onConfirm = jest.fn();
    render(
      <TemplateSelector
        value=""
        pageTemplates={[{ name: "Temp", components: [], preview: "", disabled: true }]}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByText("Temp"));
    expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

