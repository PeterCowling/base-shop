import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { vi } from "vitest";

import type { BookingPaymentItem } from "../BookingPaymentsLists";
import type { PrepaymentsViewProps } from "../PrepaymentsView";

// Mock BookingPaymentsLists to expose counts and totals
vi.mock("../BookingPaymentsLists", () => {
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

import PrepaymentsView from "../PrepaymentsView";

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
      setFilterText: vi.fn(),
      lastCompletedBooking: null,
      handleRecallLast: vi.fn(),
      isPete: false,
      handleDeleteClick: vi.fn(),
      isDeleteMode: false,
      handleOpenBooking: vi.fn(),
      handleRowClickForDelete: vi.fn(),
      handleMarkAsPaid: vi.fn(),
      setMessage: vi.fn(),
      createPaymentTransaction: vi.fn(),
      logActivity: vi.fn(),
      selectedBooking: null,
      showEntryDialog: false,
      handleCloseDialogs: vi.fn(),
      handleProcessPaymentAttempt: vi.fn(),
      handleSaveOrUpdateCardData: vi.fn(),
      bookingToDelete: null,
      setBookingToDelete: vi.fn(),
    };

    render(<PrepaymentsView {...props} />);
    expect(screen.getByTestId("code21-count")).toHaveTextContent("1");
    expect(screen.getByTestId("code5-count")).toHaveTextContent("1");
    expect(screen.getByTestId("code6-count")).toHaveTextContent("1");
    expect(screen.getByTestId("summary-total")).toHaveTextContent("60");
  });
});

