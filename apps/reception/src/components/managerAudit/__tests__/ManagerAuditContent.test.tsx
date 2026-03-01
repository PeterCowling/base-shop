import "@testing-library/jest-dom";

import { render, screen, within } from "@testing-library/react";

import { canAccess } from "../../../lib/roles";
import ManagerAuditContent from "../ManagerAuditContent";

/* eslint-disable no-var */
var useInventoryItemsMock: jest.Mock;
var useInventoryLedgerMock: jest.Mock;
var useTillShiftsDataMock: jest.Mock;
var useCheckinsMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { uid: "user-1", user_name: "pete", roles: ["owner"], email: "pete@test.com" },
  }),
}));

jest.mock("../../../hooks/data/inventory/useInventoryItems", () => {
  useInventoryItemsMock = jest.fn();
  return { __esModule: true, default: useInventoryItemsMock };
});

jest.mock("../../../hooks/data/inventory/useInventoryLedger", () => {
  useInventoryLedgerMock = jest.fn();
  return { __esModule: true, default: useInventoryLedgerMock };
});

jest.mock("../../../hooks/data/till/useTillShiftsData", () => {
  useTillShiftsDataMock = jest.fn();
  return { useTillShiftsData: useTillShiftsDataMock };
});

jest.mock("../../../hooks/data/useCheckins", () => {
  useCheckinsMock = jest.fn();
  return { useCheckins: useCheckinsMock };
});

jest.mock("../../../lib/roles", () => ({
  canAccess: jest.fn(() => true),
  Permissions: { MANAGEMENT_ACCESS: ["owner"] },
}));

beforeEach(() => {
  jest.clearAllMocks();

  (canAccess as jest.Mock).mockReturnValue(true);
  useInventoryItemsMock.mockReturnValue({
    items: [],
    itemsById: {},
    loading: false,
    error: null,
  });
  useInventoryLedgerMock.mockReturnValue({
    entries: [],
    loading: false,
    error: null,
  });
  useTillShiftsDataMock.mockReturnValue({
    shifts: [],
    loading: false,
    error: null,
  });
  useCheckinsMock.mockReturnValue({
    checkins: null,
    loading: false,
    error: null,
  });
});

describe("ManagerAuditContent", () => {
  it("renders all manager audit sections when user can access", () => {
    render(<ManagerAuditContent />);

    expect(screen.getByText("Stock Variance")).toBeInTheDocument();
    expect(screen.getByText("Recent Shifts")).toBeInTheDocument();
    expect(screen.getByText("Check-ins Today")).toBeInTheDocument();
  });

  it("returns null when user does not have management access", () => {
    (canAccess as jest.Mock).mockReturnValue(false);

    const { container } = render(<ManagerAuditContent />);

    expect(container.firstChild).toBeNull();
    expect(screen.queryByText("Manager Audit")).not.toBeInTheDocument();
  });

  it("requests the last 3 shifts and renders open/closed rows null-safely", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [
        {
          id: "s1",
          status: "closed",
          openedAt: "2026-02-28T07:00:00Z",
          closedAt: "2026-02-28T10:00:00Z",
          closedBy: "Pete",
          closeDifference: 0,
          varianceSignoffRequired: false,
        },
        {
          id: "s2",
          status: "open",
          openedAt: "2026-02-28T11:00:00Z",
          closedAt: undefined,
          closedBy: undefined,
          closeDifference: undefined,
          varianceSignoffRequired: false,
        },
      ],
      loading: false,
      error: null,
    });

    render(<ManagerAuditContent />);

    expect(useTillShiftsDataMock).toHaveBeenCalledWith({ limitToLast: 3 });
    expect(screen.getByText("Closed")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("requests checkins for today and shows count", () => {
    const todayKey = new Date().toISOString().split("T")[0];
    useCheckinsMock.mockReturnValue({
      checkins: { [todayKey]: { "occ-1": {}, "occ-2": {} } },
      loading: false,
      error: null,
    });

    render(<ManagerAuditContent />);

    expect(useCheckinsMock).toHaveBeenCalledWith({ startAt: todayKey, endAt: todayKey });
    expect(screen.getByText("2 check-in(s) today")).toBeInTheDocument();
  });

  it("shows loading indicators per section when all data hooks are loading", () => {
    useInventoryItemsMock.mockReturnValue({ items: [], itemsById: {}, loading: true, error: null });
    useInventoryLedgerMock.mockReturnValue({ entries: [], loading: true, error: null });
    useTillShiftsDataMock.mockReturnValue({ shifts: [], loading: true, error: null });
    useCheckinsMock.mockReturnValue({ checkins: null, loading: true, error: null });

    render(<ManagerAuditContent />);

    expect(screen.getAllByText("Loading...").length).toBeGreaterThanOrEqual(3);
  });

  it("renders stock variance delta rows with positive sign formatting", () => {
    const now = Date.now();
    useInventoryItemsMock.mockReturnValue({
      items: [],
      itemsById: { "item-1": { id: "item-1", name: "Test Item", unit: "pz" } },
      loading: false,
      error: null,
    });
    useInventoryLedgerMock.mockReturnValue({
      entries: [{ id: "e1", itemId: "item-1", type: "count", quantity: 3, timestamp: now - 1000 }],
      loading: false,
      error: null,
    });

    render(<ManagerAuditContent />);

    expect(screen.getByText("Test Item")).toBeInTheDocument();
    expect(screen.getByText("+3")).toBeInTheDocument();
  });

  it("shows zero checkins when no checkins are available for today", () => {
    useCheckinsMock.mockReturnValue({
      checkins: null,
      loading: false,
      error: null,
    });

    render(<ManagerAuditContent />);

    expect(screen.getByText("0 check-in(s) today")).toBeInTheDocument();
  });

  it("renders 'Counted by' column with staff name from entry.user", () => {
    const now = Date.now();
    useInventoryItemsMock.mockReturnValue({
      items: [],
      itemsById: { "item-1": { id: "item-1", name: "Test Item", unit: "pz" } },
      loading: false,
      error: null,
    });

    // TC-01: entry with user "alice" — column header and value both render
    useInventoryLedgerMock.mockReturnValue({
      entries: [
        { id: "e-user", itemId: "item-1", type: "count", quantity: 2, timestamp: now - 1000, user: "alice" },
      ],
      loading: false,
      error: null,
    });

    render(<ManagerAuditContent />);

    expect(screen.getByText("Counted by")).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("renders '—' in 'Counted by' column when entry.user is empty", () => {
    const now = Date.now();
    useInventoryItemsMock.mockReturnValue({
      items: [],
      itemsById: { "item-1": { id: "item-1", name: "Test Item", unit: "pz" } },
      loading: false,
      error: null,
    });

    // TC-02: entry with blank user — fallback "—" renders in the Stock Variance table
    useInventoryLedgerMock.mockReturnValue({
      entries: [
        { id: "e-blank", itemId: "item-1", type: "count", quantity: 1, timestamp: now - 1000, user: "" },
      ],
      loading: false,
      error: null,
    });

    render(<ManagerAuditContent />);

    const stockVarianceSection = screen.getByText("Stock Variance").closest("section")!;
    const dashCells = within(stockVarianceSection).getAllByText("—");
    expect(dashCells.length).toBeGreaterThanOrEqual(1);
  });
});
