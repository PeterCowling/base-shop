/* i18n-exempt file -- tests use literal copy for assertions */
// Ensure human-friendly labels are used instead of i18n keys in tests
jest.mock("@acme/i18n", () => ({
  __esModule: true,
  useTranslations: () => (key: string) =>
    ({
      "deliveryScheduler.mode.label": "Delivery Mode",
      "deliveryScheduler.mode.placeholder": "Select mode",
      "deliveryScheduler.mode.delivery": "Delivery",
      "deliveryScheduler.mode.pickup": "Pickup",
      "deliveryScheduler.date.label": "Date",
      "deliveryScheduler.region.label": "Region",
      "deliveryScheduler.region.placeholder": "Select region",
      "deliveryScheduler.window.label": "Window",
      "deliveryScheduler.window.placeholder": "Select window",
      "deliveryScheduler.time.label": "Time",
    }[key] ?? key),
}));
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeliveryScheduler } from "../DeliveryScheduler";

describe("DeliveryScheduler handlers", () => {
  it("emits onChange when date and time inputs change (no windows)", async () => {
    const onChange = jest.fn();
    render(<DeliveryScheduler onChange={onChange} />);

    // Date input
    const date = screen.getByLabelText("Date");
    fireEvent.change(date, { target: { value: "2024-12-25" } });
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
    fireEvent.change(time, { target: { value: "10:30" } });
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
