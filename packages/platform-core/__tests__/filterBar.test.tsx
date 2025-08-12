import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import FilterBar from "../src/components/shop/FilterBar";

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
      expect(onChange).toHaveBeenLastCalledWith({ size: undefined });
    });
  });
});
