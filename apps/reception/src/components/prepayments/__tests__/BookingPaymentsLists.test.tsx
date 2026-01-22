import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import BookingPaymentsLists, { type BookingPaymentItem } from "../BookingPaymentsLists";

describe("BookingPaymentsLists", () => {
  const baseItem: BookingPaymentItem = {
    bookingRef: "AAA",
    amountToCharge: 100,
    occupantId: "1",
    occupantName: "Alice",
    hoursElapsed: 10,
    codes: [5],
    checkInDate: "2025-01-01",
    ccCardNumber: "1111",
    ccExpiry: "12/25",
  };

  it("renders non-empty lists and handles interactions", async () => {
    const onOpenBooking = jest.fn();
    const onBookingClick = jest.fn();
    const createPaymentTransaction = jest.fn().mockResolvedValue(undefined);
    const logActivity = jest.fn().mockResolvedValue(undefined);
    const setMessage = jest.fn();
    const onMarkAsPaid = jest.fn().mockResolvedValue(undefined);

    render(
      <BookingPaymentsLists
        code21List={[baseItem]}
        code5List={[]}
        code6List={[]}
        onOpenBooking={onOpenBooking}
        onBookingClick={onBookingClick}
        createPaymentTransaction={createPaymentTransaction}
        logActivity={logActivity}
        setMessage={setMessage}
        onMarkAsPaid={onMarkAsPaid}
      />
    );

    expect(
      screen.getByText(/agreed to terms and conditions/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/second attempt failed/i)
    ).not.toBeInTheDocument();

    const row = screen.getByText("Alice").closest("[role='button']");
    expect(row).toBeTruthy();
    if (!row) throw new Error("row not found");
    fireEvent.doubleClick(row);
    expect(onOpenBooking).toHaveBeenCalledWith(baseItem);

    fireEvent.click(row);
    expect(onBookingClick).toHaveBeenCalledWith(baseItem);

    fireEvent.click(screen.getByText("€100.00"));
    await waitFor(() =>
      expect(createPaymentTransaction).toHaveBeenCalledWith(
        "AAA",
        "1",
        100
      )
    );
    await waitFor(() =>
      expect(logActivity).toHaveBeenCalledWith(
        "1",
        8,
        expect.any(String)
      )
    );
    await waitFor(() =>
      expect(setMessage).toHaveBeenCalledWith(
        "Payment paid for AAA"
      )
    );

    logActivity.mockClear();
    setMessage.mockClear();
    fireEvent.click(screen.getByText(/mark as failed/i));
    await waitFor(() =>
      expect(logActivity).toHaveBeenCalledWith(
        "1",
        6,
        expect.any(String)
      )
    );
    await waitFor(() =>
      expect(setMessage).toHaveBeenCalledWith(
        "Payment failed for AAA"
      )
    );
  });
});
