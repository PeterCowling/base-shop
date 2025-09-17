import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ShopOverridesSection from "../sections/ShopOverridesSection";

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
      Accordion: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      AccordionContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      AccordionItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      AccordionTrigger: ({ children, ...props }: any) => (
        <button type="button" {...props}>
          {children}
        </button>
      ),
      Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
      Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
      CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
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

describe("ShopOverridesSection", () => {
  it("invokes row controller actions and surfaces errors", () => {
    const filterController = createController([{ key: "color", value: "attributes.color" }]);
    const priceController = createController([{ key: "en", value: "10" }]);

    render(
      <ShopOverridesSection
        filterMappings={filterController}
        priceOverrides={priceController}
        errors={{ priceOverrides: { general: ["must not be empty"] } }}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("color"), {
      target: { value: "size" },
    });
    expect(filterController.update).toHaveBeenCalledWith(0, "key", "size");

    fireEvent.change(screen.getByPlaceholderText("attributes.color"), {
      target: { value: "attributes.size" },
    });
    expect(filterController.update).toHaveBeenCalledWith(
      0,
      "value",
      "attributes.size",
    );

    fireEvent.change(screen.getByPlaceholderText("en-GB"), {
      target: { value: "fr" },
    });
    expect(priceController.update).toHaveBeenCalledWith(0, "key", "fr");

    fireEvent.change(screen.getByPlaceholderText("12000"), {
      target: { value: "20" },
    });
    expect(priceController.update).toHaveBeenCalledWith(0, "value", "20");

    fireEvent.click(screen.getByText(/Add filter mapping/i));
    expect(filterController.add).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/Add price override/i));
    expect(priceController.add).toHaveBeenCalled();

    fireEvent.click(screen.getAllByText(/Remove/i)[0]);
    expect(filterController.remove).toHaveBeenCalledWith(0);

    const chip = screen.getByText(/must not be empty/i);
    expect(chip).toHaveAttribute("data-token", "--color-danger");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
