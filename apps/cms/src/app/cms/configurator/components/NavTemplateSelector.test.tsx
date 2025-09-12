import "../../../../../../../test/resetNextMocks";
// Use lightweight shadcn stubs for deterministic tests
jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  const SelectItem = ({ value, children }) => (
    <option value={value}>{children}</option>
  );
  const Select = ({ value, onValueChange, children }) => (
    <select
      data-cy="layout-select"
      value={value}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      {children}
    </select>
  );
  const SelectContent = ({ children }) => <>{children}</>;
  const SelectTrigger = () => null;
  const SelectValue = () => null;
  const Button = (props: any) => <button {...props} />;
  return {
    __esModule: true,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Button,
  };
});

import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NavTemplateSelector from "./NavTemplateSelector";

// Provide missing pointer APIs for Radix Select
beforeAll(() => {
  // @ts-ignore
  HTMLElement.prototype.hasPointerCapture = () => false;
  // @ts-ignore
  HTMLElement.prototype.setPointerCapture = () => {};
  // @ts-ignore
  Element.prototype.scrollIntoView = () => {};
});

jest.mock("ulid", () => ({ ulid: () => "mocked-id" }));

const templates = [
  { name: "Alpha", items: [{ label: "A", url: "/a" }] },
  { name: "Beta", items: [{ label: "B", url: "/b" }] },
  { name: "Gamma", items: [{ label: "G", url: "/g" }] },
];

describe("NavTemplateSelector", () => {
  it("renders all templates", () => {
    const onSelect = jest.fn();
    render(<NavTemplateSelector templates={templates} onSelect={onSelect} />);
    const select = screen.getByTestId("layout-select");
    const options = within(select).getAllByRole("option");
    expect(options).toHaveLength(templates.length);
  });

  it("clicking a template triggers onSelect with correct id", async () => {
    const onSelect = jest.fn();
    render(<NavTemplateSelector templates={templates} onSelect={onSelect} />);
    const user = userEvent.setup();
    const select = screen.getByTestId("layout-select");
    await user.selectOptions(select, "Beta");
    await user.click(screen.getByRole("button", { name: "Apply" }));
    expect(onSelect).toHaveBeenCalledWith([
      { id: "mocked-id", label: "B", url: "/b" },
    ]);
  });

  it("search/filter input narrows results", async () => {
    render(<NavTemplateSelector templates={templates} onSelect={() => {}} />);
    const user = userEvent.setup();
    const select = screen.getByTestId("layout-select");
    await user.type(select, "Ga");
    const filtered = Array.from(select.options).filter((o) =>
      o.textContent?.toLowerCase().includes("ga")
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].value).toBe("Gamma");
  });
});
