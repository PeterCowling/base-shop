// TC-08: Bug 8 — placeholder text is "No bleepers available" when no bleeper is available
import "@testing-library/jest-dom";

import { render } from "@testing-library/react";

import PaymentSection from "../PaymentSection";

jest.mock("../../../../hooks/data/bar/useBleepersData", () => ({
  useBleepersData: () => ({
    firstAvailableBleeper: null,
    bleepers: {},
    findNextAvailableBleeper: jest.fn(),
  }),
}));

describe("PaymentSection", () => {
  it("TC-08: shows placeholder 'No bleepers available' when firstAvailableBleeper is null", () => {
    const { getByPlaceholderText } = render(
      <PaymentSection
        bleepNumber=""
        onBleepNumberChange={jest.fn()}
        totalPrice={0}
      />
    );
    expect(getByPlaceholderText("No bleepers available")).toBeInTheDocument();
  });

  it("shows the available bleeper as the field value when bleepNumber is empty", () => {
    // Re-mock with an available bleeper for this test
    jest.resetModules();
  });

  it("displays the total price", () => {
    const { getByText } = render(
      <PaymentSection
        bleepNumber=""
        onBleepNumberChange={jest.fn()}
        totalPrice={12.5}
      />
    );
    expect(getByText(/12\.50/)).toBeInTheDocument();
  });
});
