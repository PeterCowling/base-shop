import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import ExtensionPayModal from "../ExtensionPayModal";

const updateMock = jest.fn();
const toastMock = jest.fn();
const saveCityTaxMock = jest.fn();
const saveActivityMock = jest.fn();

jest.mock("../../../../hoc/withModalBackground", () => ({
  __esModule: true,
  withModalBackground: <P extends object>(c: React.ComponentType<P>) => c,
}));

jest.mock("../../../../hooks/mutations/useChangeBookingDatesMutator", () => ({
  __esModule: true,
  useBookingDatesMutator: () => ({ updateBookingDates: updateMock }),
}));

jest.mock("../../../../hooks/mutations/useCityTaxMutation", () => ({
  __esModule: true,
  default: () => ({ saveCityTax: saveCityTaxMock }),
}));

jest.mock("../../../../hooks/mutations/useActivitiesMutations", () => ({
  __esModule: true,
  useActivitiesMutations: () => ({
    saveActivity: saveActivityMock,
  }),
}));

jest.mock("../../../../context/AuthContext", () => ({
  __esModule: true,
  useAuth: () => ({ user: { user_name: "tester" } }),
}));

jest.mock("../../../../utils/toastUtils", () => ({
  __esModule: true,
  showToast: (...args: [string, string]) => toastMock(...args),
}));

const defaultProps = {
  fullName: "Alice Smith",
  nightlyRate: 10,
  occupantCount: 2,
  nights: 1,
  bookingRef: "B1",
  occupantId: "o1",
  occupantIds: ["o1", "o2"],
  checkOutDate: "2024-05-05",
  bookingOccupants: {
    o1: { checkInDate: "2024-05-01", checkOutDate: "2024-05-05" },
    o2: { checkInDate: "2024-05-01", checkOutDate: "2024-05-05" },
  },
  cityTaxRecords: {
    o1: { balance: 5, totalDue: 5, totalPaid: 0 },
    o2: { balance: 0, totalDue: 5, totalPaid: 5 },
  },
  onClose: jest.fn(),
};

describe("ExtensionPayModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateMock.mockResolvedValue(undefined);
    saveCityTaxMock.mockResolvedValue(undefined);
    saveActivityMock.mockResolvedValue(undefined);
  });

  it("renders options and amounts", () => {
    render(<ExtensionPayModal {...defaultProps} />);
    expect(screen.getByText("Extend Booking")).toBeInTheDocument();
    expect(screen.getByLabelText(/extend only this guest/i)).toBeChecked();
    expect(screen.getByLabelText(/extend all guests/i)).not.toBeChecked();
    expect(screen.getByText(/collect:/i)).toHaveTextContent("10,00");
    expect(screen.getByText(/collect city tax:/i)).toHaveTextContent("5,00");
    expect(
      screen.getByLabelText(/mark city tax as paid/i)
    ).not.toBeChecked();
    expect(
      screen.getByLabelText(/confirm key has been extended/i)
    ).not.toBeChecked();
  });

  it("extends single guest", async () => {
    const onClose = jest.fn();
    render(<ExtensionPayModal {...defaultProps} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: /extend/i }));
    expect(updateMock).toHaveBeenCalledWith({
      bookingRef: "B1",
      occupantId: "o1",
      oldCheckIn: "2024-05-01",
      oldCheckOut: "2024-05-05",
      newCheckIn: "2024-05-01",
      newCheckOut: "2024-05-06",
      extendedPrice: "10",
    });
    expect(saveCityTaxMock).not.toHaveBeenCalled();
    expect(saveActivityMock).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
    expect(toastMock).toHaveBeenCalledWith("Extension saved", "success");
  });

  it("extends all guests when selected", async () => {
    const onClose = jest.fn();
    render(<ExtensionPayModal {...defaultProps} onClose={onClose} />);
    await userEvent.click(screen.getByLabelText(/extend all guests/i));
    await userEvent.click(screen.getByRole("button", { name: /extend/i }));

    expect(updateMock).toHaveBeenCalledTimes(2);
    expect(updateMock).toHaveBeenNthCalledWith(1, {
      bookingRef: "B1",
      occupantId: "o1",
      oldCheckIn: "2024-05-01",
      oldCheckOut: "2024-05-05",
      newCheckIn: "2024-05-01",
      newCheckOut: "2024-05-06",
      extendedPrice: "10",
    });
    expect(updateMock).toHaveBeenNthCalledWith(2, {
      bookingRef: "B1",
      occupantId: "o2",
      oldCheckIn: "2024-05-01",
      oldCheckOut: "2024-05-05",
      newCheckIn: "2024-05-01",
      newCheckOut: "2024-05-06",
      extendedPrice: "10",
    });
    expect(saveCityTaxMock).not.toHaveBeenCalled();
    expect(saveActivityMock).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("records city tax and key extension when selected", async () => {
    const onClose = jest.fn();
    render(<ExtensionPayModal {...defaultProps} onClose={onClose} />);

    await userEvent.click(
      screen.getByLabelText(/mark city tax as paid/i)
    );
    await userEvent.click(
      screen.getByLabelText(/confirm key has been extended/i)
    );
    await userEvent.click(screen.getByRole("button", { name: /extend/i }));

    expect(saveCityTaxMock).toHaveBeenCalledWith("B1", "o1", {
      balance: 0,
      totalPaid: 5,
    });
    expect(saveActivityMock).toHaveBeenNthCalledWith(1, "o1", {
      code: 9,
    });
    expect(saveActivityMock).toHaveBeenNthCalledWith(2, "o1", {
      code: 30,
    });
    expect(onClose).toHaveBeenCalled();
  });
});
