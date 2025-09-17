import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import ShopLocalizationSection from "../sections/ShopLocalizationSection";

jest.mock(
  "@ui/components",
  () => {
    const actual = jest.requireActual("@ui/components");
    const React = jest.requireActual("react");
    return {
      ...actual,
      Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
      Input: (props: any) => <input {...props} />,
      Accordion: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      AccordionItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      AccordionTrigger: ({ children, ...props }: any) => (
        <button type="button" {...props}>
          {children}
        </button>
      ),
      AccordionContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      Select: ({ children, value, onValueChange, name }: any) => {
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
        return (
          <select
            name={name}
            value={value ?? ""}
            onChange={(event) => onValueChange?.(event.target.value)}
            data-testid="mock-select"
            data-cy="mock-select"
          >
            <option value="" disabled>
              Select locale
            </option>
            {items.map((item: any) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        );
      },
      SelectTrigger: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      SelectValue: ({ placeholder, children }: any) => children ?? placeholder,
      SelectContent: Object.assign(
        ({ children }: any) => <>{children}</>,
        { displayName: "MockSelectContent" },
      ),
      SelectItem: ({ value, children }: any) => (
        <option value={value}>{children}</option>
      ),
      Chip: ({ children, ...props }: any) => (
        <span data-testid="chip" data-cy="chip" {...props}>
          {children}
        </span>
      ),
    };
  },
  { virtual: true },
);

function createController(initial: Array<{ key: string; value: string }>) {
  return {
    rows: initial,
    add: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    setRows: jest.fn(),
  } as any;
}

describe("ShopLocalizationSection", () => {
  it("allows updates and displays errors", () => {
    const localeController = createController([{ key: "title", value: "en" }]);

    render(
      <ShopLocalizationSection
        localeOverrides={localeController}
        errors={{ localeOverrides: ["must not be empty"] }}
        availableLocales={["en", "de"]}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("/collections/new"), {
      target: { value: "/collections/sale" },
    });
    expect(localeController.update).toHaveBeenCalledWith(
      0,
      "key",
      "/collections/sale",
    );

    fireEvent.change(screen.getByTestId("mock-select"), {
      target: { value: "de" },
    });
    expect(localeController.update).toHaveBeenCalledWith(0, "value", "de");

    fireEvent.click(screen.getByText(/Add locale override/i));
    expect(localeController.add).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/Remove/i));
    expect(localeController.remove).toHaveBeenCalledWith(0);

    expect(screen.getByTestId("chip")).toHaveTextContent(/must not be empty/i);
  });
});
