 
import "@testing-library/jest-dom";

import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import MealOrderPage from "../MealOrderPage";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock("../BreakfastOrderWizard", () => ({
  BreakfastOrderWizard: ({
    onSubmit,
    isSubmitting,
  }: {
    onSubmit: (v: string) => void;
    serviceDate: string;
    isSubmitting: boolean;
  }) => (
    <button
      type="button"
      onClick={() =>
        onSubmit(
          "Eggs (Scrambled) | Bacon, Ham, Toast | Americano | 09:00",
        )
      }
      disabled={isSubmitting}
    >
      Submit breakfast wizard
    </button>
  ),
}));

jest.mock("../EvDrinkOrderWizard", () => ({
  __esModule: true,
  default: ({
    onSubmit,
    isSubmitting,
  }: {
    onSubmit: (v: string) => void;
    serviceDate: string;
    preorders: unknown;
    isSubmitting: boolean;
  }) => (
    <button
      type="button"
      onClick={() => onSubmit("Aperol Spritz | 19:30")}
      disabled={isSubmitting}
    >
      Submit drink wizard
    </button>
  ),
}));

// ---------------------------------------------------------------------------
// Shared mock factories
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("MealOrderPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("TC-01: eligible guest creates a breakfast order via wizard", async () => {
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

    // Select a future service date so the wizard appears
    const dateSelect = screen.getByLabelText("Service date") as HTMLSelectElement;
    const selectedDate =
      Array.from(dateSelect.options)
        .map((o) => o.value)
        .find((v) => v !== "") ?? "";

    fireEvent.change(dateSelect, { target: { value: selectedDate } });

    // The mocked wizard renders a button; click it to simulate completion
    fireEvent.click(screen.getByRole("button", { name: "Submit breakfast wizard" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/firebase/preorders",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            token: "token-1",
            service: "breakfast",
            serviceDate: selectedDate,
            value: "Eggs (Scrambled) | Bacon, Ham, Toast | Americano | 09:00",
            requestChangeException: false,
          }),
        }),
      );
      expect(screen.getByText("Order saved.")).toBeInTheDocument();
      expect(refetchMock).toHaveBeenCalledTimes(1);
    });
  });

  it("TC-03: same-day edit escalates through exception request", async () => {
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

    // First fetch: policyBlocked; second: success after exception
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ policyBlocked: true, requestQueued: false }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          requestQueued: true,
          message:
            "Same-day changes require reception approval. A request has been sent.",
        }),
      });

    render(<MealOrderPage service="breakfast" title="Complimentary Breakfast" />);

    const dateSelect = screen.getByLabelText("Service date") as HTMLSelectElement;
    const selectedDate =
      Array.from(dateSelect.options)
        .map((o) => o.value)
        .find((v) => v === today) ?? today;

    fireEvent.change(dateSelect, { target: { value: selectedDate } });

    // Wizard submission triggers the first fetch → policyBlocked
    fireEvent.click(screen.getByRole("button", { name: "Submit breakfast wizard" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Same-day changes are blocked. You can request a reception override.",
        ),
      ).toBeInTheDocument();
    });

    // Exception button should now be visible
    fireEvent.click(
      screen.getByRole("button", { name: "Request same-day exception" }),
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({
        method: "POST",
        body: JSON.stringify({
          service: "breakfast",
          serviceDate: selectedDate,
          value: "Eggs (Scrambled) | Bacon, Ham, Toast | Americano | 09:00",
          requestChangeException: true,
        }),
      });
      expect(
        screen.getByText(
          "Same-day changes require reception approval. A request has been sent.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("TC-D01: existingOrders shows breakfastText (not breakfast txnId) when breakfastText is set", () => {
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
          night2: {
            night: "Night2",
            breakfast: "txn_20990211091523042",
            breakfastText: "Eggs (Scrambled) | Bacon, Ham | Americano | 09:00",
            breakfastTxnId: "txn_20990211091523042",
            drink1: "NA",
            drink2: "NA",
            serviceDate: "2099-02-11",
          },
        },
      },
      token: "token-1",
      isLoading: false,
      refetch: jest.fn(),
    });

    render(<MealOrderPage service="breakfast" title="Complimentary Breakfast" />);

    // Should show the human-readable text, not the raw txnId
    expect(screen.getByText("Eggs (Scrambled) | Bacon, Ham | Americano | 09:00")).toBeInTheDocument();
    expect(screen.queryByText("txn_20990211091523042")).not.toBeInTheDocument();
  });

  it("TC-D02: existingOrders shows legacy breakfast value when no breakfastText", () => {
    useGuestBookingSnapshotMock.mockReturnValue({
      snapshot: {
        checkInDate: "2099-02-10",
        checkOutDate: "2099-02-12",
        preorders: {
          night1: {
            night: "Night1",
            breakfast: "Continental",
            drink1: "NA",
            drink2: "NA",
            serviceDate: "2099-02-10",
          },
        },
      },
      token: "token-1",
      isLoading: false,
      refetch: jest.fn(),
    });

    render(<MealOrderPage service="breakfast" title="Complimentary Breakfast" />);

    // Without breakfastText, falls back to breakfast value
    expect(screen.getByText("Continental")).toBeInTheDocument();
  });

  it("TC-D06: existingOrders shows drink1Text for drink service when present", () => {
    useGuestBookingSnapshotMock.mockReturnValue({
      snapshot: {
        checkInDate: "2099-02-10",
        checkOutDate: "2099-02-12",
        preorders: {
          night1: {
            night: "Night1",
            breakfast: "NA",
            drink1: "PREPAID MP B",
            drink1Txn: "txn_20990210191530000",
            drink1Text: "Aperol Spritz | 19:30",
            drink2: "NA",
            serviceDate: "2099-02-10",
          },
        },
      },
      token: "token-1",
      isLoading: false,
      refetch: jest.fn(),
    });

    render(<MealOrderPage service="drink" title="Evening Drinks" />);

    // Should show human-readable drink text, not entitlement marker
    expect(screen.getByText("Aperol Spritz | 19:30")).toBeInTheDocument();
    expect(screen.queryByText("PREPAID MP B")).not.toBeInTheDocument();
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
      screen.getByText(
        "This service is not included in your booking. You can still explore the menu at reception.",
      ),
    ).toBeInTheDocument();
  });
});
