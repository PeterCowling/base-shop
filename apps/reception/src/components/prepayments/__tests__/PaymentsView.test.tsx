import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";

import type { BookingPaymentItem } from "../BookingPaymentsLists";
import type { PrepaymentsViewProps } from "../PrepaymentsView";
import PrepaymentsView from "../PrepaymentsView";

// Mock BookingPaymentsLists to expose counts and totals
jest.mock("../BookingPaymentsLists", () => {
  return {
    __esModule: true,
    default: ({ code21List, code5List, code6List }: { code21List: BookingPaymentItem[]; code5List: BookingPaymentItem[]; code6List: BookingPaymentItem[]; }) => {
      const total = [...code21List, ...code5List, ...code6List].reduce(
        (sum, item) => sum + item.amountToCharge,
        0
      );
      return (
        <div>
          <div data-testid="code21-count">{code21List.length}</div>
          <div data-testid="code5-count">{code5List.length}</div>
          <div data-testid="code6-count">{code6List.length}</div>
          <div data-testid="summary-total">{total}</div>
        </div>
      );
    },
  };
});

const item = (overrides: Partial<BookingPaymentItem>): BookingPaymentItem => ({
  bookingRef: "REF",
  amountToCharge: 0,
  occupantId: "1",
  occupantName: "Name",
  hoursElapsed: null,
  codes: [],
  ...overrides,
});

describe("PaymentsView", () => {
  it("renders payment lists and totals", () => {
    const props: PrepaymentsViewProps = {
      loading: false,
      error: null,
      relevantData: [],
      code21List: [item({ amountToCharge: 10 })],
      code5List: [item({ amountToCharge: 20 })],
      code6List: [item({ amountToCharge: 30 })],
      filterText: "",
      setFilterText: jest.fn(),
      lastCompletedBooking: null,
      handleRecallLast: jest.fn(),
      isPete: false,
      handleDeleteClick: jest.fn(),
      isDeleteMode: false,
      handleOpenBooking: jest.fn(),
      handleRowClickForDelete: jest.fn(),
      handleMarkAsPaid: jest.fn(),
      setMessage: jest.fn(),
      createPaymentTransaction: jest.fn(),
      logActivity: jest.fn(),
      selectedBooking: null,
      showEntryDialog: false,
      handleCloseDialogs: jest.fn(),
      handleProcessPaymentAttempt: jest.fn(),
      handleSaveOrUpdateCardData: jest.fn(),
      bookingToDelete: null,
      setBookingToDelete: jest.fn(),
    };

    render(<PrepaymentsView {...props} />);
    expect(screen.getByTestId("code21-count")).toHaveTextContent("1");
    expect(screen.getByTestId("code5-count")).toHaveTextContent("1");
    expect(screen.getByTestId("code6-count")).toHaveTextContent("1");
    expect(screen.getByTestId("summary-total")).toHaveTextContent("60");
  });
});

