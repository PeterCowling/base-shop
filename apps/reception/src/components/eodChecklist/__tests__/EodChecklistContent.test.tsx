import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";

import { canAccess } from "../../../lib/roles";
import EodChecklistContent from "../EodChecklistContent";

/* eslint-disable no-var */
var useTillShiftsDataMock: jest.Mock;
var useSafeCountsDataMock: jest.Mock;
var useCashCountsDataMock: jest.Mock;
var useInventoryLedgerMock: jest.Mock;
var useEodClosureDataMock: jest.Mock;
var confirmDayClosedMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: {
      uid: "user-1",
      user_name: "pete",
      roles: ["owner"],
      email: "pete@test.com",
    },
  }),
}));

jest.mock("../../../hooks/data/till/useTillShiftsData", () => {
  useTillShiftsDataMock = jest.fn();
  return { useTillShiftsData: useTillShiftsDataMock };
});

jest.mock("../../../hooks/data/useSafeCountsData", () => {
  useSafeCountsDataMock = jest.fn();
  return { useSafeCountsData: useSafeCountsDataMock };
});

jest.mock("../../../hooks/data/useCashCountsData", () => {
  useCashCountsDataMock = jest.fn();
  return { useCashCountsData: useCashCountsDataMock };
});

jest.mock("../../../hooks/data/inventory/useInventoryLedger", () => {
  useInventoryLedgerMock = jest.fn();
  return { __esModule: true, default: useInventoryLedgerMock };
});

jest.mock("../../../hooks/data/useEodClosureData", () => {
  useEodClosureDataMock = jest.fn();
  return { useEodClosureData: useEodClosureDataMock };
});

jest.mock("../../../hooks/mutations/useEodClosureMutations", () => {
  confirmDayClosedMock = jest.fn();
  return {
    useEodClosureMutations: () => ({ confirmDayClosed: confirmDayClosedMock }),
  };
});

jest.mock("../../../lib/roles", () => ({
  canAccess: jest.fn(() => true),
  Permissions: { MANAGEMENT_ACCESS: ["owner"] },
}));

jest.mock("../../../utils/dateUtils", () => ({
  startOfDayIso: jest.fn(() => "2026-02-28T00:00:00.000+00:00"),
  endOfDayIso: jest.fn(() => "2026-02-28T23:59:59.999+00:00"),
  sameItalyDate: jest.fn(
    (ts: string | number | Date) =>
      typeof ts === "string" && ts.startsWith("2026-02-28")
  ),
  formatItalyDateTimeFromIso: jest.fn(
    (iso: string) => `formatted:${iso}`
  ),
}));

beforeEach(() => {
  jest.clearAllMocks();

  (canAccess as jest.Mock).mockReturnValue(true);
  useTillShiftsDataMock.mockReturnValue({
    shifts: [],
    loading: false,
    error: null,
  });
  useSafeCountsDataMock.mockReturnValue({
    safeCounts: [],
    loading: false,
    error: null,
  });
  useCashCountsDataMock.mockReturnValue({
    cashCounts: [],
    loading: false,
    error: null,
  });
  useInventoryLedgerMock.mockReturnValue({
    entries: [],
    loading: false,
    error: null,
  });
  useEodClosureDataMock.mockReturnValue({
    closure: null,
    loading: false,
    error: null,
  });
  confirmDayClosedMock.mockResolvedValue(undefined);
});

describe("EodChecklistContent", () => {
  it("TC-01: returns null when user does not have management access", () => {
    (canAccess as jest.Mock).mockReturnValue(false);

    const { container } = render(<EodChecklistContent />);

    expect(container.firstChild).toBeNull();
  });

  it("TC-02: shows till loading indicator when useTillShiftsData is loading", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [],
      loading: true,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.getByTestId("till-loading")).toBeInTheDocument();
    expect(screen.getByTestId("till-loading")).toHaveTextContent(
      "Loading..."
    );
  });

  it("TC-03: all three done — shows done state on all cards", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [
        {
          id: "s1",
          status: "closed",
          openedAt: "2026-02-28T07:00:00Z",
          closedAt: "2026-02-28T10:00:00Z",
        },
      ],
      loading: false,
      error: null,
    });
    useSafeCountsDataMock.mockReturnValue({
      safeCounts: [
        {
          id: "sc1",
          type: "safeReconcile",
          timestamp: "2026-02-28T20:00:00Z",
        },
      ],
      loading: false,
      error: null,
    });
    useInventoryLedgerMock.mockReturnValue({
      entries: [
        {
          id: "e1",
          type: "count",
          timestamp: "2026-02-28T18:00:00Z",
          itemId: "item-1",
        },
      ],
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    const statusEls = screen.getAllByTestId(
      /till-status|safe-status|stock-status/
    );
    statusEls.forEach((el) => {
      expect(el).toHaveTextContent("Complete");
    });
  });

  it("TC-04: till has open shift — till card shows incomplete", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [
        {
          id: "s1",
          status: "open",
          openedAt: "2026-02-28T15:00:00Z",
        },
      ],
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.getByTestId("till-status")).toHaveTextContent("Incomplete");
  });

  it("TC-05: stock entries but none with type count today — stock incomplete", () => {
    useInventoryLedgerMock.mockReturnValue({
      entries: [
        {
          id: "e1",
          type: "receive",
          timestamp: "2026-02-28T10:00:00Z",
          itemId: "item-1",
        },
      ],
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.getByTestId("stock-status")).toHaveTextContent("Incomplete");
  });

  it("TC-06: safe entries but none with safeReconcile or reconcile type — safe incomplete", () => {
    useSafeCountsDataMock.mockReturnValue({
      safeCounts: [
        { id: "sc1", type: "deposit", timestamp: "2026-02-28T10:00:00Z" },
      ],
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.getByTestId("safe-status")).toHaveTextContent("Incomplete");
  });

  it("TC-07: mixed state — each card reflects its own signal independently", () => {
    // till: done (no open shifts)
    useTillShiftsDataMock.mockReturnValue({
      shifts: [
        { id: "s1", status: "closed", openedAt: "2026-02-28T07:00:00Z" },
      ],
      loading: false,
      error: null,
    });
    // safe: done (has reconcile entry)
    useSafeCountsDataMock.mockReturnValue({
      safeCounts: [
        { id: "sc1", type: "reconcile", timestamp: "2026-02-28T20:00:00Z" },
      ],
      loading: false,
      error: null,
    });
    // stock: incomplete (no count entry today)
    useInventoryLedgerMock.mockReturnValue({
      entries: [],
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.getByTestId("till-status")).toHaveTextContent("Complete");
    expect(screen.getByTestId("safe-status")).toHaveTextContent("Complete");
    expect(screen.getByTestId("stock-status")).toHaveTextContent("Incomplete");
  });

  it("TC-08: shows safe loading indicator when useSafeCountsData is loading", () => {
    useSafeCountsDataMock.mockReturnValue({
      safeCounts: [],
      loading: true,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.getByTestId("safe-loading")).toBeInTheDocument();
    expect(screen.getByTestId("safe-loading")).toHaveTextContent(
      "Loading..."
    );
  });

  it("TC-09: shows stock loading indicator when useInventoryLedger is loading", () => {
    useInventoryLedgerMock.mockReturnValue({
      entries: [],
      loading: true,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.getByTestId("stock-loading")).toBeInTheDocument();
    expect(screen.getByTestId("stock-loading")).toHaveTextContent(
      "Loading..."
    );
  });

  it("TC-10: allDone=true, closure=null, eodClosureLoading=false — confirm button visible, banner absent", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [{ id: "s1", status: "closed", openedAt: "2026-02-28T07:00:00Z" }],
      loading: false,
      error: null,
    });
    useSafeCountsDataMock.mockReturnValue({
      safeCounts: [{ id: "sc1", type: "safeReconcile", timestamp: "2026-02-28T20:00:00Z" }],
      loading: false,
      error: null,
    });
    useInventoryLedgerMock.mockReturnValue({
      entries: [{ id: "e1", type: "count", timestamp: "2026-02-28T18:00:00Z", itemId: "item-1" }],
      loading: false,
      error: null,
    });
    useEodClosureDataMock.mockReturnValue({
      closure: null,
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.getByTestId("confirm-day-closed")).toBeInTheDocument();
    expect(screen.queryByTestId("day-closed-banner")).not.toBeInTheDocument();
  });

  it("TC-11: allDone=true, closure exists, eodClosureLoading=false — banner with timestamp visible, confirm button absent", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [{ id: "s1", status: "closed", openedAt: "2026-02-28T07:00:00Z" }],
      loading: false,
      error: null,
    });
    useSafeCountsDataMock.mockReturnValue({
      safeCounts: [{ id: "sc1", type: "safeReconcile", timestamp: "2026-02-28T20:00:00Z" }],
      loading: false,
      error: null,
    });
    useInventoryLedgerMock.mockReturnValue({
      entries: [{ id: "e1", type: "count", timestamp: "2026-02-28T18:00:00Z", itemId: "item-1" }],
      loading: false,
      error: null,
    });
    useEodClosureDataMock.mockReturnValue({
      closure: {
        date: "2026-02-28",
        timestamp: "2026-02-28T22:30:00.000+01:00",
        confirmedBy: "pete",
      },
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.getByTestId("day-closed-banner")).toBeInTheDocument();
    expect(screen.getByTestId("day-closed-banner")).toHaveTextContent("pete");
    expect(screen.getByTestId("day-closed-banner")).toHaveTextContent(
      "formatted:2026-02-28T22:30:00.000+01:00"
    );
    expect(screen.queryByTestId("confirm-day-closed")).not.toBeInTheDocument();
  });

  it("TC-12: allDone=false — confirm button absent", () => {
    // till: incomplete (open shift)
    useTillShiftsDataMock.mockReturnValue({
      shifts: [{ id: "s1", status: "open", openedAt: "2026-02-28T15:00:00Z" }],
      loading: false,
      error: null,
    });
    useEodClosureDataMock.mockReturnValue({
      closure: null,
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.queryByTestId("confirm-day-closed")).not.toBeInTheDocument();
  });

  it("TC-13: confirm button clicked — confirmDayClosed called once", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [{ id: "s1", status: "closed", openedAt: "2026-02-28T07:00:00Z" }],
      loading: false,
      error: null,
    });
    useSafeCountsDataMock.mockReturnValue({
      safeCounts: [{ id: "sc1", type: "safeReconcile", timestamp: "2026-02-28T20:00:00Z" }],
      loading: false,
      error: null,
    });
    useInventoryLedgerMock.mockReturnValue({
      entries: [{ id: "e1", type: "count", timestamp: "2026-02-28T18:00:00Z", itemId: "item-1" }],
      loading: false,
      error: null,
    });
    useEodClosureDataMock.mockReturnValue({
      closure: null,
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    fireEvent.click(screen.getByTestId("confirm-day-closed"));

    expect(confirmDayClosedMock).toHaveBeenCalledTimes(1);
  });

  it("TC-14: shows float loading indicator when useCashCountsData is loading", () => {
    useCashCountsDataMock.mockReturnValue({
      cashCounts: [],
      loading: true,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.getByTestId("float-loading")).toBeInTheDocument();
    expect(screen.getByTestId("float-loading")).toHaveTextContent(
      "Loading..."
    );
  });

  it("TC-15: openingFloat entry for today marks float as complete", () => {
    useCashCountsDataMock.mockReturnValue({
      cashCounts: [
        {
          id: "cc1",
          type: "openingFloat",
          timestamp: "2026-02-28T06:30:00Z",
          amount: 50,
        },
      ],
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.getByTestId("float-status")).toHaveTextContent("Complete");
  });

  it("TC-16: no openingFloat entry for today marks float as incomplete and shows button", () => {
    useCashCountsDataMock.mockReturnValue({
      cashCounts: [],
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.getByTestId("float-status")).toHaveTextContent(
      "Incomplete"
    );
    expect(screen.getByTestId("float-set-button")).toBeInTheDocument();
    expect(screen.getByTestId("float-set-button")).toHaveTextContent(
      "Set Opening Float"
    );
  });

  it("TC-17: intra-shift float entry does not satisfy openingFloat completion", () => {
    useCashCountsDataMock.mockReturnValue({
      cashCounts: [
        {
          id: "cc1",
          type: "float",
          timestamp: "2026-02-28T06:30:00Z",
          amount: 20,
        },
      ],
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.getByTestId("float-status")).toHaveTextContent(
      "Incomplete"
    );
    expect(screen.getByTestId("float-set-button")).toBeInTheDocument();
  });
});
