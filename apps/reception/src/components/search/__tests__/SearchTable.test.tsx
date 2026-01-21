import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/* eslint-disable no-var */
var extDataMock: jest.Mock;
var activitiesMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../CopyableBookingRef", () => ({
  __esModule: true,
  default: ({ text }: { text: string }) => <span>{text}</span>,
}));
jest.mock("../EditableBalanceCell", () => ({
  __esModule: true,
  default: ({ initialValue }: { initialValue: number }) => (
    <td data-testid="balance">{initialValue}</td>
  ),
}));
jest.mock("../SmallSpinner", () => ({
  __esModule: true,
  default: () => <div data-testid="spinner" />,
}));
jest.mock("../../../utils/toastUtils", () => ({ showToast: jest.fn() }));

jest.mock("../../../hooks/orchestrations/useExtendedGuestFinancialData", () => {
  extDataMock = jest.fn();
  return {
    __esModule: true,
    default: (...args: unknown[]) => extDataMock(...args),
  };
});
jest.mock("../../../hooks/data/useActivitiesData", () => {
  activitiesMock = jest.fn();
  return {
    __esModule: true,
    default: (...args: unknown[]) => activitiesMock(...args),
  };
});

import BookingSearchTable from "../BookingSearchTable";
import type { Guest } from "../../../types/component/bookingSearch";

describe("BookingSearchTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders columns and guest values", () => {
    const guests: Guest[] = [
      {
        bookingRef: "BR1",
        guestId: "G1",
        firstName: "Bob",
        lastName: "Jones",
        activityLevel: "Level 2",
        refundStatus: "Non-Refundable",
      },
      {
        bookingRef: "BR2",
        guestId: "G2",
        firstName: "Alice",
        lastName: "Smith",
        activityLevel: "Level 1",
        refundStatus: "Refundable",
      },
    ];

    const extended = [
      { ...guests[0], balance: 20, totalPaid: 5, totalAdjust: 0, transactions: [] },
      { ...guests[1], balance: 10, totalPaid: 0, totalAdjust: 0, transactions: [] },
    ];

    extDataMock.mockReturnValue({ extendedGuests: extended, loading: false, error: null });
    activitiesMock.mockReturnValue({ activities: {}, loading: false, error: null });

    render(<BookingSearchTable guests={guests} searchTriggered />);

    expect(screen.getByRole("columnheader", { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /booking ref/i })).toBeInTheDocument();

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(3);
    // default sort by name ascending
    expect(rows[1]).toHaveTextContent("Alice Smith");
    expect(rows[2]).toHaveTextContent("Bob Jones");
  });

  it("sorts rows when header clicked", async () => {
    const user = userEvent.setup();
    const guests: Guest[] = [
      {
        bookingRef: "BR1",
        guestId: "G1",
        firstName: "Bob",
        lastName: "Jones",
        activityLevel: "Level 2",
        refundStatus: "Non-Refundable",
      },
      {
        bookingRef: "BR2",
        guestId: "G2",
        firstName: "Alice",
        lastName: "Smith",
        activityLevel: "Level 1",
        refundStatus: "Refundable",
      },
    ];

    const extended = [
      { ...guests[0], balance: 20, totalPaid: 5, totalAdjust: 0, transactions: [] },
      { ...guests[1], balance: 10, totalPaid: 0, totalAdjust: 0, transactions: [] },
    ];

    extDataMock.mockReturnValue({ extendedGuests: extended, loading: false, error: null });
    activitiesMock.mockReturnValue({ activities: {}, loading: false, error: null });

    render(<BookingSearchTable guests={guests} searchTriggered />);

    let rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Alice Smith");

    await user.click(screen.getByRole("columnheader", { name: /booking ref/i }));

    rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("BR1");
  });

  it("expands a row when toggle clicked", async () => {
    const user = userEvent.setup();
    const guests: Guest[] = [
      {
        bookingRef: "BR1",
        guestId: "G1",
        firstName: "Alice",
        lastName: "Smith",
        activityLevel: "Level 1",
        refundStatus: "Refundable",
      },
    ];
    const extended = [
      { ...guests[0], balance: 10, totalPaid: 0, totalAdjust: 0, transactions: [] },
    ];

    extDataMock.mockReturnValue({ extendedGuests: extended, loading: false, error: null });
    activitiesMock.mockReturnValue({
      activities: { G1: { a1: { code: 1, timestamp: "2024", who: "staff" } } },
      loading: false,
      error: null,
    });

    render(<BookingSearchTable guests={guests} searchTriggered />);

    const btn = screen.getByRole("button", { name: /expand row/i });
    await user.click(btn);

    expect(screen.getByText(/activities/i)).toBeInTheDocument();
  });
});
