import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { canAccess } from "../../../lib/roles";
import EodChecklistContent from "../EodChecklistContent";

/* eslint-disable no-var */
var useTillShiftsDataMock: jest.Mock;
var useSafeCountsDataMock: jest.Mock;
var useInventoryLedgerMock: jest.Mock;
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

jest.mock("../../../hooks/data/inventory/useInventoryLedger", () => {
  useInventoryLedgerMock = jest.fn();
  return { __esModule: true, default: useInventoryLedgerMock };
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
  useInventoryLedgerMock.mockReturnValue({
    entries: [],
    loading: false,
    error: null,
  });
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
});
