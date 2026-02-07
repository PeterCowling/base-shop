import "@testing-library/jest-dom";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import MealOrderPage from "../MealOrderPage";

const useGuestBookingSnapshotMock = jest.fn();
const fetchMock = jest.fn();

jest.mock("@/hooks/dataOrchestrator/useGuestBookingSnapshot", () => ({
  useGuestBookingSnapshot: () => useGuestBookingSnapshotMock(),
}));

function getRomeTodayIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

describe("MealOrderPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("TC-01: eligible guest creates future-date order successfully", async () => {
    const refetchMock = jest.fn(async () => undefined);
    useGuestBookingSnapshotMock.mockReturnValue({
      snapshot: {
        checkInDate: "2099-02-10",
        checkOutDate: "2099-02-12",
        preorders: {
          night1: {
            night: "Night1",
            breakfast: "PREPAID_MP_A",
            drink1: "NA",
            drink2: "NA",
            serviceDate: "2099-02-10",
          },
        },
      },
      token: "token-1",
      isLoading: false,
      refetch: refetchMock,
    });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ message: "Order saved." }),
    });

    render(<MealOrderPage service="breakfast" title="Complimentary Breakfast" />);
    const dateSelect = screen.getByLabelText("Service date") as HTMLSelectElement;
    const selectedDate =
      Array.from(dateSelect.options)
        .map((option) => option.value)
        .find((value) => value !== "") ?? "";

    fireEvent.change(dateSelect, {
      target: { value: selectedDate },
    });
    fireEvent.change(screen.getByLabelText("Order details"), {
      target: { value: "Continental" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save order" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/firebase/preorders",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            token: "token-1",
            service: "breakfast",
            serviceDate: selectedDate,
            value: "Continental",
            requestChangeException: false,
          }),
        }),
      );
      expect(screen.getByText("Order saved.")).toBeInTheDocument();
      expect(refetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it("TC-03: same-day edit can escalate through exception request flow", async () => {
    const today = getRomeTodayIso();
    const refetchMock = jest.fn(async () => undefined);
    useGuestBookingSnapshotMock.mockReturnValue({
      snapshot: {
        checkInDate: today,
        checkOutDate: today,
        preorders: {
          night1: {
            night: "Night1",
            breakfast: "PREPAID_MP_A",
            drink1: "NA",
            drink2: "NA",
            serviceDate: today,
          },
        },
      },
      token: "token-1",
      isLoading: false,
      refetch: refetchMock,
    });
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          policyBlocked: true,
          requestQueued: false,
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requestQueued: true,
          message: "Same-day changes require reception approval. A request has been sent.",
        }),
      });

    render(<MealOrderPage service="breakfast" title="Complimentary Breakfast" />);
    const dateSelect = screen.getByLabelText("Service date") as HTMLSelectElement;
    const selectedDate =
      Array.from(dateSelect.options)
        .map((option) => option.value)
        .find((value) => value === today) ?? today;

    fireEvent.change(dateSelect, {
      target: { value: selectedDate },
    });
    fireEvent.change(screen.getByLabelText("Order details"), {
      target: { value: "Vegan" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save order" }));

    await waitFor(() => {
      expect(
        screen.getByText("Same-day changes are blocked. You can request a reception override."),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Request same-day exception" }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
        method: "POST",
        body: JSON.stringify({
          token: "token-1",
          service: "breakfast",
          serviceDate: selectedDate,
          value: "Vegan",
          requestChangeException: true,
        }),
      });
      expect(
        screen.getByText("Same-day changes require reception approval. A request has been sent."),
      ).toBeInTheDocument();
    });
  });

  it("TC-04: ineligible booking renders no-order CTA state", () => {
    useGuestBookingSnapshotMock.mockReturnValue({
      snapshot: {
        checkInDate: "2099-02-10",
        checkOutDate: "2099-02-12",
        preorders: {
          night1: {
            night: "Night1",
            breakfast: "NA",
            drink1: "NA",
            drink2: "NA",
          },
        },
      },
      token: "token-1",
      isLoading: false,
      refetch: jest.fn(),
    });

    render(<MealOrderPage service="breakfast" title="Complimentary Breakfast" />);
    expect(
      screen.getByText("This service is not included in your booking. You can still explore the menu at reception."),
    ).toBeInTheDocument();
  });
});
