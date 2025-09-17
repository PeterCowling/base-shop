import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import type { MappingRowsController } from "../../useShopEditorSubmit";
import ShopOverridesSection from "../ShopOverridesSection";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Accordion: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    AccordionItem: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    AccordionTrigger: ({ children, type = "button", ...props }: any) => (
      <button type={type} {...props}>
        {children}
      </button>
    ),
    AccordionContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Button: ({ children, type = "button", ...props }: any) => (
      <button type={type} {...props}>
        {children}
      </button>
    ),
    Input: (props: any) => <input {...props} />,
  }),
  { virtual: true },
);

jest.mock(
  "@ui/components",
  () => {
    const React = require("react");
    const {
      Card,
      CardContent,
      Accordion,
      AccordionItem,
      AccordionTrigger,
      AccordionContent,
    } = require("@/components/atoms/shadcn");

    const SelectContent = Object.assign(
      ({ children, ...props }: any) => <div {...props}>{children}</div>,
      { displayName: "MockSelectContent" },
    );

    const SelectTrigger = Object.assign(
      ({ children, ...props }: any) => <div {...props}>{children}</div>,
      { displayName: "MockSelectTrigger" },
    );

    const SelectValue = Object.assign(
      ({ placeholder, children }: any) => children ?? placeholder ?? null,
      { displayName: "MockSelectValue" },
    );

    const SelectItem = ({ value, children, ...props }: any) => (
      <option value={value} {...props}>
        {children}
      </option>
    );

    const Select = ({
      children,
      value,
      onValueChange,
      name,
      className,
      ...selectProps
    }: any) => {
      const nodes = React.Children.toArray(children);
      const trigger = nodes.find(
        (child: any) => child?.type?.displayName === "MockSelectTrigger",
      ) as any;
      const content = nodes.find(
        (child: any) => child?.type?.displayName === "MockSelectContent",
      ) as any;

      const triggerChildren = trigger
        ? React.Children.toArray(trigger.props.children)
        : [];
      const valueNode = triggerChildren.find(
        (child: any) => child?.type?.displayName === "MockSelectValue",
      ) as any;
      const placeholder = valueNode ? valueNode.props.placeholder : undefined;

      const options = content
        ? React.Children.toArray(content.props.children).map((child: any) => ({
            value: child.props.value,
            label: child.props.children,
          }))
        : [];

      const combinedClassName = [className, trigger?.props?.className]
        .filter(Boolean)
        .join(" ");

      return (
        <select
          {...selectProps}
          name={name}
          value={value ?? ""}
          onChange={(event) => onValueChange?.(event.target.value)}
          className={combinedClassName}
          id={trigger?.props?.id}
          aria-describedby={trigger?.props?.["aria-describedby"]}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    };

    const Button = ({ children, type = "button", ...props }: any) => (
      <button type={type} {...props}>
        {children}
      </button>
    );

    const Input = (props: any) => <input {...props} />;

    const FormField = ({
      children,
      label,
      htmlFor,
      error,
      className,
      ...props
    }: any) => (
      <div className={className} {...props}>
        <label htmlFor={htmlFor}>{label}</label>
        {children}
        {error}
      </div>
    );

    const Chip = ({ children, ...props }: any) => (
      <span {...props}>{children}</span>
    );

    return {
      Card,
      CardContent,
      Accordion,
      AccordionItem,
      AccordionTrigger,
      AccordionContent,
      Button,
      FormField,
      Input,
      Select,
      SelectTrigger,
      SelectValue,
      SelectContent,
      SelectItem,
      Chip,
    };
  },
  { virtual: true },
);

describe("ShopOverridesSection", () => {
  function createController(
    rows: MappingRowsController["rows"],
  ): MappingRowsController {
    return {
      rows,
      add: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      setRows: jest.fn(),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders overrides and wires controller actions", () => {
    const filterController = createController([
      { key: "color", value: "attributes.color" },
    ]);
    const priceController = createController([{ key: "en-GB", value: "12000" }]);

    render(
      <ShopOverridesSection
        filterMappings={filterController}
        priceOverrides={priceController}
        errors={{ priceOverrides: { general: ["must not be empty"] } }}
      />,
    );

    expect(screen.getByLabelText("Filter key")).toBeInTheDocument();
    expect(screen.getByLabelText("Catalog attribute")).toBeInTheDocument();
    expect(screen.getByLabelText("Locale")).toBeInTheDocument();

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
      target: { value: "fr-FR" },
    });
    expect(priceController.update).toHaveBeenCalledWith(0, "key", "fr-FR");

    fireEvent.change(screen.getByPlaceholderText("12000"), {
      target: { value: "24000" },
    });
    expect(priceController.update).toHaveBeenCalledWith(0, "value", "24000");

    fireEvent.click(screen.getByRole("button", { name: "Add filter mapping" }));
    expect(filterController.add).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Add price override" }));
    expect(priceController.add).toHaveBeenCalledTimes(1);

    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    fireEvent.click(removeButtons[0]);
    expect(filterController.remove).toHaveBeenCalledWith(0);

    fireEvent.click(removeButtons[1]);
    expect(priceController.remove).toHaveBeenCalledWith(0);

    const errorChip = screen.getByText("must not be empty");
    expect(errorChip).toBeInTheDocument();
    expect(errorChip).toHaveClass("text-destructive");
  });
});
