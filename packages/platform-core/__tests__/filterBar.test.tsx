import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
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

  it("defers rapid input changes", async () => {
    const onChange = jest.fn();
    const defs: FilterDefinition[] = [
      { name: "maxPrice", label: "Max Price", type: "number" },
    ];
    render(<FilterBar definitions={defs} onChange={onChange} />);
    const price = screen.getByLabelText(/Max Price/);

    act(() => {
      fireEvent.change(price, { target: { value: "1" } });
      fireEvent.change(price, { target: { value: "12" } });
      fireEvent.change(price, { target: { value: "123" } });
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChange).toHaveBeenLastCalledWith({ maxPrice: 123 });
    });
  });

  it("provides accessible labels", () => {
    const onChange = jest.fn();
    const defs: FilterDefinition[] = [
      { name: "size", label: "Size", type: "select", options: ["39"] },
    ];
    render(<FilterBar definitions={defs} onChange={onChange} />);
    expect(screen.getByRole("form", { name: /filters/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Size/)).toBeInTheDocument();
  });
});

