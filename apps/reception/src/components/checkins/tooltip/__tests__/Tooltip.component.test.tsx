import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Tooltip from "../Tooltip";

const baseBooking = {
  personalDetails: {
    firstName: "Jane",
    lastName: "Doe",
    reservationCode: "RES1",
    room: { booked: "1", allocated: "2" },
  },
  mealPlans: { level: "Gold", type: "All-Inclusive" },
  notes: "Frequent guest",
};

describe("Tooltip component", () => {
  it("shows upgrade info with meal plan details and notes", async () => {
    const onDoubleClick = vi.fn();

    render(<Tooltip booking={baseBooking} onDoubleClick={onDoubleClick} />);

    // meal plan and notes
    expect(screen.getByText(/Meal Plan Level:/)).toHaveTextContent(
      "Meal Plan Level: Gold"
    );
    expect(screen.getByText(/Meal Plan Type:/)).toHaveTextContent(
      "Meal Plan Type: All-Inclusive"
    );
    expect(screen.getByText(/Notes:/)).toHaveTextContent(
      "Notes: Frequent guest"
    );

    // upgrade branch
    const upgrade = screen.getByText(/Room Upgrade to:/);
    expect(upgrade).toHaveTextContent("Room Upgrade to: 2 from 1");

    await userEvent.dblClick(screen.getByRole("button", { name: "Jane Doe" }));
    expect(onDoubleClick).toHaveBeenCalled();
  });

  it("shows side-grade info when allocated room is equivalent", () => {
    const booking = {
      personalDetails: {
        firstName: "John",
        lastName: "Smith",
        reservationCode: "RES2",
        room: { booked: "5", allocated: "6" },
      },
    };

    render(<Tooltip booking={booking} />);

    const side = screen.getByText(/Room Side-grade to:/);
    expect(side).toHaveTextContent("Room Side-grade to: 6");
  });
});
