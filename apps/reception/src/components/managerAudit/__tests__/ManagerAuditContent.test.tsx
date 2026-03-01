import "@testing-library/jest-dom";

import { fireEvent, render, screen, within } from "@testing-library/react";

import { canAccess } from "../../../lib/roles";
import { showToast } from "../../../utils/toastUtils";
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

jest.mock("../../../utils/toastUtils", () => ({
  showToast: jest.fn(),
}));

const showToastMock = showToast as unknown as jest.Mock;

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

  it('TC-16: staffFilter "bob" with entry.user "alice" shows 0 rows', () => {
    const now = Date.now();
    useInventoryItemsMock.mockReturnValue({
      items: [],
      itemsById: { "item-1": { id: "item-1", name: "Test Item", unit: "pz" } },
      loading: false,
      error: null,
    });
    useInventoryLedgerMock.mockReturnValue({
      entries: [
        { id: "e-staff", itemId: "item-1", type: "count", quantity: 2, timestamp: now - 1000, user: "alice" },
      ],
      loading: false,
      error: null,
    });

    render(<ManagerAuditContent />);

    fireEvent.change(screen.getByTestId("variance-staff-filter"), { target: { value: "bob" } });

    const stockVarianceSection = screen.getByText("Stock Variance").closest("section")!;
    expect(within(stockVarianceSection).queryByText("alice")).not.toBeInTheDocument();
    expect(screen.getByText("No variance in the selected period")).toBeInTheDocument();
  });

  it("TC-17: empty staffFilter includes entries with empty user", () => {
    const now = Date.now();
    useInventoryItemsMock.mockReturnValue({
      items: [],
      itemsById: { "item-1": { id: "item-1", name: "Test Item", unit: "pz" } },
      loading: false,
      error: null,
    });
    useInventoryLedgerMock.mockReturnValue({
      entries: [
        { id: "e-empty-user", itemId: "item-1", type: "count", quantity: 1, timestamp: now - 1000, user: "" },
      ],
      loading: false,
      error: null,
    });

    render(<ManagerAuditContent />);

    expect(screen.getByText("Test Item")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("TC-15: item filter shows one item and resets to all", () => {
    const now = Date.now();
    useInventoryItemsMock.mockReturnValue({
      items: [
        { id: "item-a", name: "Alfa", unit: "pz" },
        { id: "item-b", name: "Beta", unit: "pz" },
      ],
      itemsById: {
        "item-a": { id: "item-a", name: "Alfa", unit: "pz" },
        "item-b": { id: "item-b", name: "Beta", unit: "pz" },
      },
      loading: false,
      error: null,
    });
    useInventoryLedgerMock.mockReturnValue({
      entries: [
        { id: "e-item-a", itemId: "item-a", type: "count", quantity: 2, timestamp: now - 1000, user: "alice" },
        { id: "e-item-b", itemId: "item-b", type: "count", quantity: -1, timestamp: now - 2000, user: "bob" },
      ],
      loading: false,
      error: null,
    });

    render(<ManagerAuditContent />);

    const stockVarianceSection = screen.getByText("Stock Variance").closest("section")!;
    expect(stockVarianceSection.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(screen.getByText("Alfa")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("variance-item-filter"), { target: { value: "item-a" } });

    expect(stockVarianceSection.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(screen.getByText("Alfa")).toBeInTheDocument();
    expect(screen.queryByText("Beta")).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("variance-item-filter"), { target: { value: "" } });

    expect(stockVarianceSection.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(screen.getByText("Alfa")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("TC-18: export button is absent when there are no matching entries", () => {
    render(<ManagerAuditContent />);

    expect(screen.queryByTestId("variance-export-btn")).not.toBeInTheDocument();
  });

  it("TC-19: export button is present when there is at least one matching entry", () => {
    const now = Date.now();
    useInventoryItemsMock.mockReturnValue({
      items: [],
      itemsById: { "item-1": { id: "item-1", name: "Test Item", unit: "pz" } },
      loading: false,
      error: null,
    });
    useInventoryLedgerMock.mockReturnValue({
      entries: [
        { id: "e-export", itemId: "item-1", type: "count", quantity: 1, timestamp: now - 1000, user: "alice" },
      ],
      loading: false,
      error: null,
    });

    render(<ManagerAuditContent />);

    expect(screen.getByTestId("variance-export-btn")).toBeInTheDocument();
  });

  it("TC-20: clicking export button calls showToast with success type", () => {
    const now = Date.now();
    useInventoryItemsMock.mockReturnValue({
      items: [],
      itemsById: { "item-1": { id: "item-1", name: "Test Item", unit: "pz" } },
      loading: false,
      error: null,
    });
    useInventoryLedgerMock.mockReturnValue({
      entries: [
        { id: "e-export-click", itemId: "item-1", type: "count", quantity: 1, timestamp: now - 1000, user: "alice" },
      ],
      loading: false,
      error: null,
    });

    const createObjectUrlSpy = jest.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    const revokeObjectUrlSpy = jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    render(<ManagerAuditContent />);

    fireEvent.click(screen.getByTestId("variance-export-btn"));

    expect(showToastMock).toHaveBeenCalledWith(expect.stringContaining("Exported"), "success");

    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
    clickSpy.mockRestore();
  });
});
