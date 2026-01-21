import React from "react";
import { fireEvent,render, screen } from "@testing-library/react";

import TemplateSelector from "../TemplateSelector";

jest.mock("@acme/ui/components/atoms", () => {
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

jest.mock("@acme/ui/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    __esModule: true,
    Button: ({ children, onClick, ...props }: any) => (
      <button onClick={onClick} {...props}>{children}</button>
    ),
    Select: ({ children, onOpenChange, onValueChange, open, value, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    SelectTrigger: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    SelectContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    SelectItem: ({ children, onSelect, asChild, ...props }: any) => (
      <div onClick={(e) => onSelect && onSelect(e)} {...props}>{children}</div>
    ),
    SelectValue: ({ placeholder }: any) => <div>{placeholder}</div>,
  };
});

jest.mock("next/image", () => {
  const React = require("react");
  const NextImageMock = ({ alt, ...props }: any) => (
    <div role="img" aria-label={alt} data-mock="next-image" {...props} />
  );
  NextImageMock.displayName = "NextImageMock";
  return { __esModule: true, default: NextImageMock };
});

describe("TemplateSelector", () => {
  it("applies layout and components on confirmation", () => {
    const onSelect = jest.fn();
    render(
      <TemplateSelector
        layout=""
        pageTemplates={[{ name: "Temp", components: [{ type: "comp" } as any], preview: "" }]}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByTestId("template-Temp"));
    fireEvent.click(screen.getByTestId("confirm-template"));
    expect(onSelect).toHaveBeenCalledWith(
      "Temp",
      [expect.objectContaining({ type: "comp", id: expect.any(String) })],
    );
  });
});
