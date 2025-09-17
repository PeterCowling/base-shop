import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import PriceOverridesSection from "../sections/PriceOverridesSection";

jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Input: (props: any) => <input {...props} />,
  }),
  { virtual: true },
);

describe("PriceOverridesSection", () => {
  it("handles overrides and displays errors", () => {
    const addOverride = jest.fn();
    const updateOverride = jest.fn();
    const removeOverride = jest.fn();

    render(
      <PriceOverridesSection
        overrides={[{ key: "en", value: "10" }]}
        addOverride={addOverride}
        updateOverride={updateOverride}
        removeOverride={removeOverride}
        errors={{ priceOverrides: ["must not be empty"] }}
      />, 
    );

    expect(screen.getByDisplayValue("en")).toBeInTheDocument();

    const keyInput = screen.getByPlaceholderText("Locale");
    fireEvent.change(keyInput, { target: { value: "fr" } });
    expect(updateOverride.mock.calls[0]).toEqual([0, "key", "fr"]);

    const valueInput = screen.getByPlaceholderText("Price");
    fireEvent.change(valueInput, { target: { value: "20" } });
    expect(updateOverride.mock.calls[1]).toEqual([0, "value", "20"]);

    fireEvent.click(screen.getByText(/Add Override/i));
    expect(addOverride).toHaveBeenCalled();

    fireEvent.click(screen.getByText(/Remove/i));
    expect(removeOverride).toHaveBeenCalledWith(0);

    expect(screen.getByText(/must not be empty/i)).toBeInTheDocument();
  });
});
