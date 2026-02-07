import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";

import type { MappingRowsController } from "../../useShopEditorSubmit";
import ShopLocalizationSection from "../ShopLocalizationSection";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  }),
  { virtual: true },
);

jest.mock(
  "@acme/design-system/atoms",
  () => {
    const React = require("react");
    const SelectContent = Object.assign(
      ({ children }: any) => <>{children}</>,
      { displayName: "MockSelectContent" },
    );
    const SelectTrigger = Object.assign(
      ({ children, ...props }: any) => <div {...props}>{children}</div>,
      { displayName: "MockSelectTrigger" },
    );
    const Select = ({ children, value, onValueChange, name }: any) => {
      const arrayChildren = React.Children.toArray(children);
      const content = arrayChildren.find(
        (child: any) => child?.type?.displayName === "MockSelectContent",
      );
      const items = content
        ? React.Children.toArray((content as any).props.children).map((child: any) => ({
            value: child.props.value,
            label: child.props.children,
          }))
        : [];
      const trigger = arrayChildren.find(
        (child: any) => child?.type?.displayName === "MockSelectTrigger",
      );
      const triggerProps = trigger ? ((trigger as any).props ?? {}) : {};
      const { id, ["aria-describedby"]: ariaDescribedBy } = triggerProps as {
        id?: string;
        ["aria-describedby"]?: string;
      };

      return (
        <select
          id={id}
          name={name}
          value={value ?? ""}
          aria-describedby={ariaDescribedBy}
          onChange={(event) => onValueChange?.(event.target.value)}
        >
          <option value="" disabled>
            {trigger ? trigger.props.children : undefined}
          </option>
          {items.map((item: any) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      );
    };
    const SelectValue = ({ placeholder, children }: any) => children ?? placeholder;
    return {
      Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
      Input: (props: any) => <input {...props} />,
      Select,
      SelectTrigger,
      SelectValue,
      SelectContent,
      SelectItem: ({ value, children }: any) => (
        <option value={value}>{children}</option>
      ),
      Chip: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    };
  },
  { virtual: true },
);

jest.mock(
  "@acme/design-system/molecules",
  () => ({
    FormField: ({ children, label, htmlFor, error }: any) => (
      <div>
        <label htmlFor={htmlFor}>{label}</label>
        {children}
        {error}
      </div>
    ),
  }),
  { virtual: true },
);

describe("ShopLocalizationSection", () => {
  it("maps form interactions through the row controller", () => {
    const add: MappingRowsController["add"] = jest.fn();
    const update: MappingRowsController["update"] = jest.fn();
    const remove: MappingRowsController["remove"] = jest.fn();

    const controller = {
      rows: [{ key: "", value: "" }],
      add,
      update,
      remove,
    } as unknown as MappingRowsController;

    render(
      <ShopLocalizationSection
        localeOverrides={controller}
        availableLocales={["en"]}
        errors={{ localeOverrides: { general: ["must not be empty"] } }}
      />,
    );

    const keyInput = screen.getByLabelText("Field key");
    const localeSelect = screen.getByLabelText("Locale");

    expect(keyInput).toBeInTheDocument();
    expect(localeSelect).toBeInTheDocument();

    fireEvent.change(keyInput, { target: { value: "/collections/sale" } });
    fireEvent.change(localeSelect, { target: { value: "en" } });

    expect(update).toHaveBeenCalledTimes(2);
    expect((update as jest.Mock).mock.calls.map(([, field, value]: [unknown, string, string]) => [field, value])).toEqual([
      ["key", "/collections/sale"],
      ["value", "en"],
    ]);

    fireEvent.click(screen.getByRole("button", { name: /Add locale override/i }));
    expect(add).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /Remove/i }));
    expect(remove).toHaveBeenCalledWith(0);

    expect(screen.getByText("must not be empty")).toHaveClass("text-destructive");
  });
});
