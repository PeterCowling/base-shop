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
    Select: ({ children, ...rest }: any) => <select {...rest}>{children}</select>,
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <option>{placeholder}</option>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children, ...rest }: any) => <option {...rest}>{children}</option>,
  };
});
import { render, fireEvent, screen } from "@testing-library/react";
import LayoutPanel from "../src/components/cms/page-builder/panels/LayoutPanel";
import type { PageComponent } from "@acme/types";

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
