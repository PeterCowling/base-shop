import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { CheckInRow } from "../../../../types/component/CheckinRow";

async function loadComponent() {
  jest.resetModules();

  const setPayTypeMock = jest.fn();
  const calculateCityTaxUpdateMock = jest.fn(() => ({ newTotalPaid: 5, newBalance: 0 }));
  const buildCityTaxTransactionMock = jest.fn(() => ({ amount: 5, type: "taxPayment", timestamp: "t" }));
  const saveCityTaxMock = jest.fn(async () => undefined);
  const addActivityMock = jest.fn(async () => undefined);
  const addToAllTransactionsMock = jest.fn(async () => undefined);

  jest.doMock("../useCityTaxAmount", () => ({
    __esModule: true,
    default: () => ({
      payType: "CASH",
      setPayType: setPayTypeMock,
      amount: 5,
      loading: false,
    }),
  }));

  jest.doMock("../useCityTaxPayment", () => ({
    __esModule: true,
    useCityTaxPayment: () => ({
      calculateCityTaxUpdate: calculateCityTaxUpdateMock,
      buildCityTaxTransaction: buildCityTaxTransactionMock,
    }),
  }));

  jest.doMock("../../../../hooks/mutations/useCityTaxMutation", () => ({
    __esModule: true,
    default: () => ({ saveCityTax: saveCityTaxMock }),
  }));

  jest.doMock("../../../../hooks/mutations/useActivitiesMutations", () => ({
    __esModule: true,
    default: () => ({ addActivity: addActivityMock }),
  }));

  jest.doMock(
    "../../../../hooks/mutations/useAllTransactionsMutations",
    () => ({
    __esModule: true,
    default: () => ({ addToAllTransactions: addToAllTransactionsMock }),
  }));

  const mod = await import("../CityTaxPaymentButton");
  return {
    Comp: mod.default,
    setPayTypeMock,
    calculateCityTaxUpdateMock,
    buildCityTaxTransactionMock,
    saveCityTaxMock,
    addActivityMock,
    addToAllTransactionsMock,
  };
}

const booking: CheckInRow = {
  bookingRef: "B1",
  occupantId: "O1",
  checkInDate: "2025-01-01",
  rooms: [],
  firstName: "Test",
  lastName: "User",
  roomBooked: "101",
  roomAllocated: "101",
  activities: [],
  isFirstForBooking: true,
  cityTax: { balance: 5, totalDue: 5, totalPaid: 0 },
};

describe("CityTaxPaymentButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls setPayType on menu selection", async () => {
    const { Comp, setPayTypeMock } = await loadComponent();
    render(<Comp booking={booking} />);

    await userEvent.click(screen.getByTitle("Click to choose payment type"));
    await userEvent.click(screen.getByText("CC"));

    expect(setPayTypeMock).toHaveBeenCalledWith("CC");
  });

  it("triggers payment workflow on button click", async () => {
    const { Comp, calculateCityTaxUpdateMock, buildCityTaxTransactionMock, saveCityTaxMock, addActivityMock, addToAllTransactionsMock } = await loadComponent();
    render(<Comp booking={booking} />);

    await userEvent.click(screen.getByTitle("Pay immediately with selected type"));

    expect(calculateCityTaxUpdateMock).toHaveBeenCalled();
    expect(buildCityTaxTransactionMock).toHaveBeenCalled();
    await waitFor(() => expect(saveCityTaxMock).toHaveBeenCalled());
    await waitFor(() => expect(addActivityMock).toHaveBeenCalled());
    await waitFor(() => expect(addToAllTransactionsMock).toHaveBeenCalled());
  });
});
