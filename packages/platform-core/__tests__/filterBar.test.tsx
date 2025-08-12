import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import FilterBar, {
  type FilterDefinition,
} from "../src/components/shop/FilterBar";

describe("FilterBar", () => {
  it("propagates changes", async () => {
    const onChange = jest.fn();
    const defs: FilterDefinition[] = [
      { name: "size", label: "Size", type: "select", options: ["39", "40"] },
      { name: "maxPrice", label: "Max Price", type: "number" },
    ];
    render(<FilterBar definitions={defs} onChange={onChange} />);
    const select = screen.getByLabelText(/Size/);
    fireEvent.change(select, { target: { value: "39" } });
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({ size: "39" });
    });

    const price = screen.getByLabelText(/Max Price/);
    fireEvent.change(price, { target: { value: "100" } });
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({ size: "39", maxPrice: 100 });
    });

    fireEvent.change(select, { target: { value: "" } });
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({ maxPrice: 100, size: undefined });
    });

    fireEvent.change(price, { target: { value: "" } });
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({ size: undefined, maxPrice: undefined });
    });
  });

  it("resets all filters when cleared", async () => {
    const onChange = jest.fn();
    const defs: FilterDefinition[] = [
      { name: "size", label: "Size", type: "select", options: ["39", "40"] },
      { name: "maxPrice", label: "Max Price", type: "number" },
    ];
    render(<FilterBar definitions={defs} onChange={onChange} />);
    const select = screen.getByLabelText(/Size/);
    const price = screen.getByLabelText(/Max Price/);
    fireEvent.change(select, { target: { value: "39" } });
    fireEvent.change(price, { target: { value: "100" } });
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({ size: "39", maxPrice: 100 });
    });

    fireEvent.click(screen.getByRole("button", { name: /Clear Filters/i }));
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({});
    });
    expect((select as HTMLSelectElement).value).toBe("");
    expect((price as HTMLInputElement).value).toBe("");
  });
});

