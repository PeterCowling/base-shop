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
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeliveryScheduler } from "../DeliveryScheduler";

describe("DeliveryScheduler", () => {
  it("fires onChange when switching modes", async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<DeliveryScheduler onChange={onChange} />);

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /pickup/i }));

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({
        mode: "pickup",
        date: "",
        region: "",
        window: "",
      })
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: /delivery/i }));

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({
        mode: "delivery",
        date: "",
        region: "",
        window: "",
      })
    );

    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("renders region dropdown only when regions are provided", () => {
    const { queryByText, rerender } = render(<DeliveryScheduler />);
    expect(queryByText("Region")).not.toBeInTheDocument();

    rerender(<DeliveryScheduler regions={["East", "West"]} />);
    expect(screen.getByText("Region")).toBeInTheDocument();
  });

  it("uses window select when windows are provided, otherwise time input", () => {
    const { rerender } = render(<DeliveryScheduler />);
    expect(screen.getByLabelText("Time")).toHaveAttribute("type", "time");

    rerender(<DeliveryScheduler windows={["10-11", "11-12"]} />);
    expect(screen.getByText("Window")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(2);
    expect(screen.queryByLabelText("Time")).not.toBeInTheDocument();
  });
});
