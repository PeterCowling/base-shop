import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ShopLocalizationSection from "../sections/ShopLocalizationSection";

jest.mock(
  "@/components/atoms/shadcn",
  () => {
    const React = require("react");

    const SelectItem = ({ value, children }: any) => (
      <option value={value}>{children}</option>
    );
    SelectItem.displayName = "MockSelectItem";

    const SelectContent = ({ children }: any) => <>{children}</>;
    SelectContent.displayName = "MockSelectContent";

    const Select = ({ children, onValueChange, value, name }: any) => {
      const options: React.ReactNode[] = [];
      React.Children.forEach(children, (child: any) => {
        if (child?.type?.displayName === "MockSelectContent") {
          React.Children.forEach(child.props.children, (option: any) => {
            if (option?.type?.displayName === "MockSelectItem") {
              options.push(
                <option key={option.props.value} value={option.props.value}>
                  {option.props.children}
                </option>,
              );
            }
          });
        }
      });
      return (
        <select
          name={name}
          value={value ?? ""}
          onChange={(event) => onValueChange?.(event.target.value)}
        >
          {options}
        </select>
      );
    };

    const SelectTrigger = ({ children }: any) => <>{children}</>;
    const SelectValue = () => null;

    return {
      Card: ({ children }: any) => <div>{children}</div>,
      CardContent: ({ children }: any) => <div>{children}</div>,
      Button: ({ children, onClick, type = "button" }: any) => (
        <button type={type} onClick={onClick}>
          {children}
        </button>
      ),
      Input: (props: any) => <input {...props} />,
      Select,
      SelectTrigger,
      SelectValue,
      SelectContent,
      SelectItem,
    };
  },
  { virtual: true },
);

jest.mock(
  "@/components/molecules/FormField",
  () => ({
    FormField: ({ label, htmlFor, error, children }: any) => (
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
  it("handles overrides and displays errors", () => {
    const onAddOverride = jest.fn();
    const onUpdateOverride = jest.fn();
    const onRemoveOverride = jest.fn();

    render(
      <ShopLocalizationSection
        overrides={[{ key: "title", value: "en" }]}
        errors={{ localeOverrides: ["must not be empty"] }}
        onAddOverride={onAddOverride}
        onUpdateOverride={onUpdateOverride}
        onRemoveOverride={onRemoveOverride}
      />,
    );

    expect(screen.getByDisplayValue("title")).toBeInTheDocument();

    const keyInput = screen.getByDisplayValue("title");
    fireEvent.change(keyInput, { target: { value: "description" } });
    expect(onUpdateOverride).toHaveBeenCalledWith(0, "key", "description");

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "de" } });
    expect(onUpdateOverride).toHaveBeenCalledWith(0, "value", "de");

    fireEvent.click(screen.getByText(/Add locale override/i));
    expect(onAddOverride).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/Remove/i));
    expect(onRemoveOverride).toHaveBeenCalledWith(0);

    expect(screen.getByText(/must not be empty/i)).toBeInTheDocument();
  });
});
