import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ShopLocalizationSection from "../sections/ShopLocalizationSection";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  }),
  { virtual: true },
);

jest.mock(
  "@ui/components",
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
      const placeholder = trigger ? trigger.props.children : undefined;
      return (
        <select
          name={name}
          value={value ?? ""}
          onChange={(event) => onValueChange?.(event.target.value)}
          data-cy="mock-select"
        >
          <option value="" disabled>
            {placeholder}
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
      FormField: ({ children, label, htmlFor, error }: any) => (
        <div>
          <label htmlFor={htmlFor}>{label}</label>
          {children}
          {error}
        </div>
      ),
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
        errors={{ localeOverrides: { general: ["must not be empty"] } }}
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

    expect(screen.getByText(/must not be empty/i)).toBeInTheDocument();
  });
});
