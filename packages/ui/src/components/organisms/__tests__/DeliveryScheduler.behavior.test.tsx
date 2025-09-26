import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeliveryScheduler } from "../DeliveryScheduler";

describe("DeliveryScheduler handlers", () => {
  it("emits onChange when date and time inputs change (no windows)", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<DeliveryScheduler onChange={onChange} />);

    // Date input
    const date = screen.getByLabelText("Date");
    await user.clear(date);
    await user.type(date, "2024-12-25");
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({
        mode: "delivery",
        date: "2024-12-25",
        region: "",
        window: "",
      })
    );

    // Time input
    const time = screen.getByLabelText("Time");
    await user.clear(time);
    await user.type(time, "10:30");
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({
        mode: "delivery",
        date: "2024-12-25",
        region: "",
        window: "10:30",
      })
    );
  });

  it("emits onChange when selecting region and window (with props)", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <DeliveryScheduler
        onChange={onChange}
        regions={["North", "South"]}
        windows={["10-11", "11-12"]}
      />
    );

    // Region
    // First combobox = mode, second = region, third = window
    const regionTrigger = screen.getAllByRole("combobox")[1];
    await user.click(regionTrigger);
    await user.click(screen.getByRole("option", { name: "North" }));
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({
        mode: "delivery",
        date: "",
        region: "North",
        window: "",
      })
    );

    // Window
    const windowTrigger = screen.getAllByRole("combobox")[2];
    await user.click(windowTrigger);
    await user.click(screen.getByRole("option", { name: "11-12" }));
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({
        mode: "delivery",
        date: "",
        region: "North",
        window: "11-12",
      })
    );
  });
});
