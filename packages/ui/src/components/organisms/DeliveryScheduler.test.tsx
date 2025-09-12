import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DeliveryScheduler } from "./DeliveryScheduler";

describe("DeliveryScheduler", () => {
  it("submits selected delivery date and time", async () => {
    const onChange = jest.fn();
    render(<DeliveryScheduler onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("Date"), {
      target: { value: "2024-01-01" },
    });

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({
        mode: "delivery",
        date: "2024-01-01",
        region: "",
        window: "",
      })
    );

    fireEvent.change(screen.getByLabelText("Time"), {
      target: { value: "13:30" },
    });

    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith({
        mode: "delivery",
        date: "2024-01-01",
        region: "",
        window: "13:30",
      })
    );
  });
});
