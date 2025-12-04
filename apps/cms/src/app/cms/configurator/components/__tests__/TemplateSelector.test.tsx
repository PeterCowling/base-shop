import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

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
}, { virtual: true });

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

jest.mock("@/components/atoms/primitives/Cluster", () => {
  const React = require("react");
  return {
    __esModule: true,
    Cluster: ({ children }: any) => <div>{children}</div>,
  };
});

jest.mock("next/image", () => {
  const React = require("react");
  const MockNextImage = (props: any) => <span data-testid="next-image" {...props} />;
  MockNextImage.displayName = "MockNextImage";
  return {
    __esModule: true,
    default: MockNextImage,
  };
});

const trackMock = jest.fn();
jest.mock("@acme/telemetry", () => ({
  __esModule: true,
  track: (...args: unknown[]) => trackMock(...args),
}));

jest.mock("@/components/atoms/primitives/Inline", () => {
  const React = require("react");
  return {
    __esModule: true,
    Inline: ({ children }: any) => <div>{children}</div>,
  };
});

const TemplateSelector = require("../TemplateSelector").default as typeof import("../TemplateSelector").default;
const atoms = require("@/components/atoms");
// Jest's moduleNameMapper routes "@/components/atoms" to a simple stub that may
// not provide the dialog primitives. Populate lightweight fallbacks when the
// mapped module omits them so the component renders without crashing.
if (!atoms.Dialog) {
  const React = require("react");
  const passthrough = ({ children }: any) => <div>{children}</div>;
  atoms.Dialog = ({ open, children }: any) => (open ? <div>{children}</div> : null);
  atoms.DialogContent = passthrough;
  atoms.DialogFooter = passthrough;
  atoms.DialogHeader = passthrough;
  atoms.DialogTitle = passthrough;
}

describe("TemplateSelector", () => {
  beforeEach(() => {
    trackMock.mockClear();
  });

  it("page navigation changes visible templates", () => {
    const pages = [
      [{ id: "one", name: "One", components: [], preview: "" }],
      [{ id: "two", name: "Two", components: [], preview: "" }],
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
    Wrapper.displayName = "TemplateSelectorPageWrapper";
    render(<Wrapper />);
    fireEvent.click(screen.getByText("Select a template"));
    expect(screen.getByText("One")).toBeInTheDocument();
    fireEvent.click(screen.getByText("next"));
    fireEvent.click(screen.getByText("Select a template"));
    expect(screen.queryByText("One")).not.toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });

  it("selecting a template triggers callback", () => {
    const onConfirm = jest.fn();
    render(
      <TemplateSelector
        value=""
        pageTemplates={[{ id: "tmp", name: "Temp", components: [{ type: "comp" } as any], preview: "" }]}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByText("Select a template"));
    fireEvent.click(screen.getByText("Temp"));
    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledWith(
      "tmp",
      [expect.objectContaining({ type: "comp", id: expect.any(String) })],
      expect.objectContaining({ id: "tmp", name: "Temp" }),
    );
    expect(trackMock).toHaveBeenCalledWith(
      "template_select",
      expect.objectContaining({ templateId: "tmp" }),
    );
  });

  it("disabled templates cannot be selected", () => {
    const onConfirm = jest.fn();
    render(
      <TemplateSelector
        value=""
        pageTemplates={[{ id: "tmp", name: "Temp", components: [], preview: "", disabled: true }]}
        onConfirm={onConfirm}
      />,
    );
    fireEvent.click(screen.getByText("Select a template"));
    fireEvent.click(screen.getByText("Temp"));
    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(trackMock).not.toHaveBeenCalled();
  });
});
