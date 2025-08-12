import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import FilterBar from "../src/components/shop/FilterBar";

describe("FilterBar", () => {
  it("propagates changes", async () => {
    const onChange = jest.fn();
    render(<FilterBar onChange={onChange} sizes={["39", "40"]} />);
    const select = screen.getByLabelText(/Size/);
    fireEvent.change(select, { target: { value: "39" } });
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({ size: "39" });
    });
    fireEvent.change(select, { target: { value: "" } });
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({ size: undefined });
    });
  });

  it("defers onChange until input settles", async () => {
    const onChange = jest.fn();
    render(<FilterBar onChange={onChange} sizes={["39", "40", "41"]} />);
    const select = screen.getByLabelText(/Size/);

    fireEvent.change(select, { target: { value: "39" } });
    fireEvent.change(select, { target: { value: "40" } });
    fireEvent.change(select, { target: { value: "41" } });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenLastCalledWith({ size: "41" });
    });
  });

  it("includes accessible labels", () => {
    render(<FilterBar onChange={() => undefined} sizes={["39", "40"]} />);
    const form = screen.getByRole("form", { name: /filters/i });
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute("aria-label", "Filters");
    expect(screen.getByLabelText(/size/i)).toBeInTheDocument();
  });
});
