import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import FilterBar from "@platform-core/src/components/shop/FilterBar";

describe("FilterBar", () => {
  it("propagates changes", async () => {
    const onChange = jest.fn();
    render(<FilterBar onChange={onChange} />);
    const select = screen.getByLabelText(/Size/);
    fireEvent.change(select, { target: { value: "39" } });
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({ size: "39" });
    });
    fireEvent.change(select, { target: { value: "" } });
    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({ size: "" });
    });
  });

  it("defers onChange until input settles", async () => {
    const onChange = jest.fn();
    render(<FilterBar onChange={onChange} />);
    const select = screen.getByLabelText(/Size/);

    await act(async () => {
      fireEvent.change(select, { target: { value: "36" } });
      fireEvent.change(select, { target: { value: "37" } });
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledTimes(2);
    });
    expect(onChange).not.toHaveBeenCalledWith({ size: "36" });
    expect(onChange).toHaveBeenLastCalledWith({ size: "37" });
  });

  it("is accessible", () => {
    const onChange = jest.fn();
    render(<FilterBar onChange={onChange} />);

    expect(screen.getByRole("form", { name: /filters/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /size/i })).toBeInTheDocument();
  });
});
