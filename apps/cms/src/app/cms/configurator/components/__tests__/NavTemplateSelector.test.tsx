import "../../../../../../../../test/resetNextMocks";

import type React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import NavTemplateSelector from "../NavTemplateSelector";
// Use lightweight shadcn stubs for deterministic tests
jest.mock("@/components/atoms/shadcn", () => {
  const React = require("react");
  const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) => (
    <option value={value}>{children}</option>
  );
  const Select = ({ value, onValueChange, children }: { value: string; onValueChange?: (v: string) => void; children: React.ReactNode }) => (
    <select
      data-cy="layout-select"
      value={value}
      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onValueChange?.(e.target.value)}
    >
      {children}
    </select>
  );
  const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
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

// Provide missing pointer APIs for Radix Select
beforeAll(() => {
  HTMLElement.prototype.hasPointerCapture = () => false;
  HTMLElement.prototype.setPointerCapture = () => {};
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
    const select = screen.getByTestId("layout-select") as HTMLSelectElement;
    await user.type(select, "Ga");
    const filtered = Array.from(select.options).filter((o) =>
      o.textContent?.toLowerCase().includes("ga")
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].value).toBe("Gamma");
  });
});
