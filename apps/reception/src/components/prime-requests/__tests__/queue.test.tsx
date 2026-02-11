import "@testing-library/jest-dom";

import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { PrimeRequestRecord } from "../../../types/hooks/data/primeRequestsData";
import PrimeRequestsQueue from "../PrimeRequestsQueue";

/* eslint-disable no-var */
var primeRequestsDataHookMock: jest.Mock;
var primeRequestResolutionHookMock: jest.Mock;
var resolveRequestMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

jest.mock("../../../hooks/data/usePrimeRequestsData", () => {
  primeRequestsDataHookMock = jest.fn();
  return {
    __esModule: true,
    default: () => primeRequestsDataHookMock(),
  };
});

jest.mock("../../../hooks/mutations/usePrimeRequestResolution", () => {
  primeRequestResolutionHookMock = jest.fn();
  return {
    __esModule: true,
    default: () => primeRequestResolutionHookMock(),
  };
});

function makeRequest(
  overrides: Partial<PrimeRequestRecord> = {},
): PrimeRequestRecord {
  return {
    requestId: "req_1",
    type: "extension",
    status: "pending",
    bookingId: "BOOK1",
    guestUuid: "occ_1",
    guestName: "Guest One",
    submittedAt: 1700000000000,
    updatedAt: 1700000000000,
    payload: {
      requestedCheckOutDate: "2026-03-10",
      currentCheckOutDate: "2026-03-05",
    },
    ...overrides,
  };
}

describe("PrimeRequestsQueue", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resolveRequestMock = jest.fn().mockResolvedValue(undefined);
    primeRequestResolutionHookMock.mockReturnValue({
      resolveRequest: resolveRequestMock,
      isResolving: false,
      error: null,
    });
  });

  it("TC-01: shows extension request with booking and occupant linkage", () => {
    const request = makeRequest();
    primeRequestsDataHookMock.mockReturnValue({
      requests: [request],
      byStatus: {
        pending: [request],
        approved: [],
        declined: [],
        completed: [],
      },
      loading: false,
      error: null,
    });

    render(<PrimeRequestsQueue />);

    expect(screen.getByText("Guest One")).toBeInTheDocument();
    expect(screen.getByText("BOOK1")).toBeInTheDocument();
    expect(screen.getByText("occ_1")).toBeInTheDocument();
    expect(screen.getByText("Checkout 2026-03-05 -> 2026-03-10")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open Extension Desk" }),
    ).toHaveAttribute("href", "/extension");
  });

  it("applies operator-selected status and note", async () => {
    const request = makeRequest({
      requestId: "bag_drop_1",
      type: "bag_drop",
      payload: {
        pickupWindow: "16:00 - 18:00",
      },
    });

    primeRequestsDataHookMock.mockReturnValue({
      requests: [request],
      byStatus: {
        pending: [request],
        approved: [],
        declined: [],
        completed: [],
      },
      loading: false,
      error: null,
    });

    render(<PrimeRequestsQueue />);

    await userEvent.selectOptions(
      screen.getByLabelText("Status for bag_drop_1"),
      "completed",
    );
    await userEvent.type(
      screen.getByLabelText("Resolution note for bag_drop_1"),
      "Collected at front desk",
    );
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(resolveRequestMock).toHaveBeenCalledWith({
      request,
      nextStatus: "completed",
      resolutionNote: "Collected at front desk",
    });
  });
});
