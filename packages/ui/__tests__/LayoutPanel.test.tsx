import { fireEvent, render, screen } from "@testing-library/react";

import type { PageComponent } from "@acme/types";

import LayoutPanel from "../src/components/cms/page-builder/panels/LayoutPanel";

jest.mock("../src/components/atoms/shadcn", () => {
  const React = require("react");
  return {
    Input: ({ label, ...rest }: any) => (
      <label>
        {label}
        <input {...rest} />
      </label>
    ),
    Button: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
    // Use simple non-form elements for Select-related mocks to avoid DOM nesting
    // issues and uncontrolled warnings in tests.
    Select: ({ children }: any) => <div>{children}</div>,
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children, onSelect }: any) => (
      <div onClick={() => onSelect?.()}>{children}</div>
    ),
  };
});

test("updates width via handleResize", () => {
  const component: PageComponent = { id: "1", type: "Image" } as any;
  const handleResize = jest.fn();
  render(
    <LayoutPanel
      component={component}
      handleInput={(() => {}) as any}
      handleResize={handleResize}
      handleFullSize={() => {}}
    />
  );
  fireEvent.change(screen.getByLabelText(/Width \(Desktop\)/), {
    target: { value: "200" },
  });
  expect(handleResize).toHaveBeenCalledWith("widthDesktop", "200");
});
