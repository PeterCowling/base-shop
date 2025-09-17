import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import ShopOverridesSection from "../sections/ShopOverridesSection";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Accordion: ({ items }: any) => (
      <div>
        {items.map((item: any) => (
          <div key={item.title}>
            <div>{item.title}</div>
            <div>{item.content}</div>
          </div>
        ))}
      </div>
    ),
    Card: ({ children }: any) => <div>{children}</div>,
    CardContent: ({ children }: any) => <div>{children}</div>,
    Button: ({ children, onClick, type = "button" }: any) => (
      <button type={type} onClick={onClick}>
        {children}
      </button>
    ),
    Input: (props: any) => <input {...props} />,
  }),
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

describe("ShopOverridesSection", () => {
  it("handles overrides and displays errors", () => {
    const onAddFilterMapping = jest.fn();
    const onUpdateFilterMapping = jest.fn();
    const onRemoveFilterMapping = jest.fn();
    const onAddPriceOverride = jest.fn();
    const onUpdatePriceOverride = jest.fn();
    const onRemovePriceOverride = jest.fn();

    render(
      <ShopOverridesSection
        filterMappings={[{ key: "color", value: "attributes.color" }]}
        priceOverrides={[{ key: "en", value: "10" }]}
        errors={{
          filterMappings: ["Filter error"],
          priceOverrides: ["Price error"],
        }}
        onAddFilterMapping={onAddFilterMapping}
        onUpdateFilterMapping={onUpdateFilterMapping}
        onRemoveFilterMapping={onRemoveFilterMapping}
        onAddPriceOverride={onAddPriceOverride}
        onUpdatePriceOverride={onUpdatePriceOverride}
        onRemovePriceOverride={onRemovePriceOverride}
      />,
    );

    const filterKey = screen.getByDisplayValue("color");
    fireEvent.change(filterKey, { target: { value: "size" } });
    expect(onUpdateFilterMapping).toHaveBeenCalledWith(0, "key", "size");

    const priceValue = screen.getByDisplayValue("10");
    fireEvent.change(priceValue, { target: { value: "20" } });
    expect(onUpdatePriceOverride).toHaveBeenCalledWith(0, "value", "20");

    fireEvent.click(screen.getByText(/Add filter mapping/i));
    expect(onAddFilterMapping).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/Add price override/i));
    expect(onAddPriceOverride).toHaveBeenCalled();

    fireEvent.click(screen.getAllByText(/Remove/)[0]);
    expect(onRemoveFilterMapping).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getAllByText(/Remove/)[1]);
    expect(onRemovePriceOverride).toHaveBeenCalledWith(0);

    expect(screen.getByText(/Filter error/)).toBeInTheDocument();
    expect(screen.getByText(/Price error/)).toBeInTheDocument();
  });
});
