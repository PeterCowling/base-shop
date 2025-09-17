import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import LocalizationSection from "../sections/LocalizationSection";

jest.mock("@ui", () => ({
  Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  FormField: ({ label, error, children, htmlFor }: any) => (
    <label htmlFor={htmlFor}>
      <span>{label}</span>
      {children}
      {error}
    </label>
  ),
  Input: (props: any) => <input {...props} />,
  Select: ({ value, onValueChange, children }: any) => (
    <select
      value={value}
      onChange={(event) => onValueChange?.(event.target.value)}
      data-cy="locale-select"
    >
      {children}
    </select>
  ),
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
  SelectValue: ({ placeholder }: any) => (
    <option value="">{placeholder}</option>
  ),
}));

describe("LocalizationSection", () => {
  const catalogFilters = {
    value: "color, size",
    error: undefined,
    onChange: jest.fn(),
  };

  const filterMappings = {
    rows: [{ key: "color", value: "attribute.color" }],
    onAdd: jest.fn(),
    onUpdate: jest.fn(),
    onRemove: jest.fn(),
    error: undefined,
  };

  const localeOverrides = {
    rows: [{ key: "title", value: "en" }],
    onAdd: jest.fn(),
    onUpdate: jest.fn(),
    onRemove: jest.fn(),
    error: ["Invalid"],
    availableLocales: ["en", "de"],
  };

  it("wires text inputs, mapping controls, and locale select", () => {
    render(
      <LocalizationSection
        catalogFilters={catalogFilters}
        filterMappings={filterMappings}
        localeOverrides={localeOverrides}
      />,
    );

    fireEvent.change(screen.getByLabelText("Catalog filters"), {
      target: { value: "brand" },
    });
    expect(catalogFilters.onChange).toHaveBeenCalledWith("brand");

    fireEvent.change(screen.getByPlaceholderText("Filter"), {
      target: { value: "size" },
    });
    expect(filterMappings.onUpdate).toHaveBeenCalledWith(0, "key", "size");

    fireEvent.click(screen.getByText("Add mapping"));
    expect(filterMappings.onAdd).toHaveBeenCalled();

    fireEvent.click(screen.getAllByText("Remove")[0]);
    expect(filterMappings.onRemove).toHaveBeenCalledWith(0);

    fireEvent.change(screen.getByTestId("locale-select"), {
      target: { value: "de" },
    });
    expect(localeOverrides.onUpdate).toHaveBeenCalledWith(0, "value", "de");

    const hidden = screen.getAllByDisplayValue("en")[1] as HTMLInputElement;
    expect(hidden.name).toBe("localeOverridesValue");

    expect(screen.getByText("Invalid")).toHaveAttribute("role", "alert");
  });
});
