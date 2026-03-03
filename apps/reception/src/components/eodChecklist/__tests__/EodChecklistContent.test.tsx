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
var confirmDayClosedWithOverrideMock: jest.Mock;
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
  confirmDayClosedWithOverrideMock = jest.fn();
  return {
    useEodClosureMutations: () => ({
      confirmDayClosed: confirmDayClosedMock,
      confirmDayClosedWithOverride: confirmDayClosedWithOverrideMock,
    }),
  };
});

jest.mock("../../../hooks/mutations/useCashCountsMutations", () => ({
  useCashCountsMutations: () => ({
    addOpeningFloatEntry: jest.fn().mockResolvedValue(undefined),
    addCashCount: jest.fn(),
    addFloatEntry: jest.fn(),
    addDeposit: jest.fn(),
    addWithdrawal: jest.fn(),
    addExchange: jest.fn(),
  }),
}));

jest.mock("../OpeningFloatModal", () => ({
  __esModule: true,
  default: ({ onClose }: { onClose: () => void }) => (
    <div data-cy="opening-float-modal">
      <button onClick={onClose} type="button">
        Close modal
      </button>
    </div>
  ),
}));

jest.mock("../EodOverrideModal", () => ({
  __esModule: true,
  default: ({
    onConfirm,
    onCancel,
  }: {
    onConfirm: (signoff: { overrideManagerName: string; overrideManagerUid?: string; overrideReason: string }) => void;
    onCancel: () => void;
  }) => (
    <div data-cy="eod-override-modal">
      <button
        type="button"
        data-cy="eod-override-modal-confirm"
        onClick={() =>
          onConfirm({
            overrideManagerName: "alice",
            overrideManagerUid: "uid-2",
            overrideReason: "Safe locked",
          })
        }
      >
        Confirm override
      </button>
      <button type="button" data-cy="eod-override-modal-cancel" onClick={onCancel}>
        Cancel override
      </button>
    </div>
  ),
}));

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
  confirmDayClosedWithOverrideMock.mockResolvedValue(undefined);
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

  it("TC-13: confirm button clicked — confirmDayClosed called once with computed snapshot", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [
        {
          id: "s1",
          status: "closed",
          openedAt: "2026-02-28T07:00:00Z",
          closedAt: "2026-02-28T10:00:00Z",
          closeDifference: 2.0,
        },
      ],
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
    expect(confirmDayClosedMock).toHaveBeenCalledWith({
      cashVariance: expect.any(Number),
      stockItemsCounted: expect.any(Number),
    });
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

  it("TC-18: clicking 'Set Opening Float' button opens the OpeningFloatModal", () => {
    useCashCountsDataMock.mockReturnValue({
      cashCounts: [],
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.queryByTestId("opening-float-modal")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("float-set-button"));

    expect(screen.getByTestId("opening-float-modal")).toBeInTheDocument();
  });

  // Override path tests (TC-19 through TC-26)

  it("TC-19: allDone=false, closure=null, eodClosureLoading=false → override button visible; confirm button absent", () => {
    // allDone=false: open shift
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

    expect(screen.getByTestId("eod-override-button")).toBeInTheDocument();
    expect(screen.queryByTestId("confirm-day-closed")).not.toBeInTheDocument();
  });

  it("TC-20: allDone=true, closure=null, eodClosureLoading=false → confirm button visible; override button absent", () => {
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
    expect(screen.queryByTestId("eod-override-button")).not.toBeInTheDocument();
  });

  it("TC-21: allDone=false, closure !== null (already closed) → override button absent; banner present", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [{ id: "s1", status: "open", openedAt: "2026-02-28T15:00:00Z" }],
      loading: false,
      error: null,
    });
    useEodClosureDataMock.mockReturnValue({
      closure: {
        date: "2026-02-28",
        timestamp: "2026-02-28T22:00:00.000+01:00",
        confirmedBy: "alice",
      },
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.queryByTestId("eod-override-button")).not.toBeInTheDocument();
    expect(screen.getByTestId("day-closed-banner")).toBeInTheDocument();
  });

  it("TC-22: override button clicked → EodOverrideModal rendered", () => {
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

    expect(screen.queryByTestId("eod-override-modal")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("eod-override-button"));

    expect(screen.getByTestId("eod-override-modal")).toBeInTheDocument();
  });

  it("TC-23: EodOverrideModal.onConfirm called → confirmDayClosedWithOverride called; modal hidden", () => {
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

    fireEvent.click(screen.getByTestId("eod-override-button"));
    expect(screen.getByTestId("eod-override-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("eod-override-modal-confirm"));

    expect(confirmDayClosedWithOverrideMock).toHaveBeenCalledTimes(1);
    expect(confirmDayClosedWithOverrideMock).toHaveBeenCalledWith({
      overrideManagerName: "alice",
      overrideManagerUid: "uid-2",
      overrideReason: "Safe locked",
    });
    expect(screen.queryByTestId("eod-override-modal")).not.toBeInTheDocument();
  });

  it("TC-24: EodOverrideModal.onCancel called → modal hidden; confirmDayClosedWithOverride not called", () => {
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

    fireEvent.click(screen.getByTestId("eod-override-button"));
    expect(screen.getByTestId("eod-override-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("eod-override-modal-cancel"));

    expect(screen.queryByTestId("eod-override-modal")).not.toBeInTheDocument();
    expect(confirmDayClosedWithOverrideMock).not.toHaveBeenCalled();
  });

  it("TC-25: closure has overrideReason and overrideManagerName → day-closed-override-note present with correct text", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [],
      loading: false,
      error: null,
    });
    useEodClosureDataMock.mockReturnValue({
      closure: {
        date: "2026-02-28",
        timestamp: "2026-02-28T22:00:00.000+01:00",
        confirmedBy: "pete",
        overrideReason: "Safe locked — key off-site",
        overrideManagerName: "alice",
        overrideManagerUid: "uid-2",
      },
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    const overrideNote = screen.getByTestId("day-closed-override-note");
    expect(overrideNote).toBeInTheDocument();
    expect(overrideNote).toHaveTextContent("Safe locked — key off-site");
    expect(overrideNote).toHaveTextContent("alice");
  });

  it("TC-26: closure has no overrideReason → day-closed-override-note absent", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [],
      loading: false,
      error: null,
    });
    useEodClosureDataMock.mockReturnValue({
      closure: {
        date: "2026-02-28",
        timestamp: "2026-02-28T22:00:00.000+01:00",
        confirmedBy: "pete",
      },
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.queryByTestId("day-closed-override-note")).not.toBeInTheDocument();
  });

  // Variance pre-close summary tests (TASK-03)

  it("TC-V01: two closed today-shifts with closeDifference → summary row shows summed cash variance", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [
        { id: "s1", status: "closed", closedAt: "2026-02-28T10:00:00Z", closeDifference: 2.0 },
        { id: "s2", status: "closed", closedAt: "2026-02-28T15:00:00Z", closeDifference: -3.5 },
      ],
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
    useEodClosureDataMock.mockReturnValue({ closure: null, loading: false, error: null });

    render(<EodChecklistContent />);

    const summary = screen.getByTestId("eod-variance-summary");
    expect(summary).toBeInTheDocument();
    // sum = 2.0 + (-3.5) = -1.5
    expect(summary).toHaveTextContent("€-1.50");
  });

  it("TC-V02: closed shifts with undefined closeDifference → summary row shows €0.00", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [
        { id: "s1", status: "closed", closedAt: "2026-02-28T10:00:00Z" },
      ],
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
    useEodClosureDataMock.mockReturnValue({ closure: null, loading: false, error: null });

    render(<EodChecklistContent />);

    const summary = screen.getByTestId("eod-variance-summary");
    expect(summary).toHaveTextContent("€+0.00");
  });

  it("TC-V03: 3 distinct itemId count entries for today → summary row shows 3 items counted", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [{ id: "s1", status: "closed", closedAt: "2026-02-28T10:00:00Z" }],
      loading: false,
      error: null,
    });
    useSafeCountsDataMock.mockReturnValue({
      safeCounts: [{ id: "sc1", type: "safeReconcile", timestamp: "2026-02-28T20:00:00Z" }],
      loading: false,
      error: null,
    });
    useInventoryLedgerMock.mockReturnValue({
      entries: [
        { id: "e1", type: "count", timestamp: "2026-02-28T18:00:00Z", itemId: "item-1" },
        { id: "e2", type: "count", timestamp: "2026-02-28T18:01:00Z", itemId: "item-2" },
        { id: "e3", type: "count", timestamp: "2026-02-28T18:02:00Z", itemId: "item-3" },
      ],
      loading: false,
      error: null,
    });
    useEodClosureDataMock.mockReturnValue({ closure: null, loading: false, error: null });

    render(<EodChecklistContent />);

    const summary = screen.getByTestId("eod-variance-summary");
    expect(summary).toHaveTextContent("3 items counted");
  });

  it("TC-V04: allDone=false → summary row absent", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [{ id: "s1", status: "open", openedAt: "2026-02-28T15:00:00Z" }],
      loading: false,
      error: null,
    });
    useEodClosureDataMock.mockReturnValue({ closure: null, loading: false, error: null });

    render(<EodChecklistContent />);

    expect(screen.queryByTestId("eod-variance-summary")).not.toBeInTheDocument();
  });

  it("TC-V05: eodClosureLoading=true → summary row absent", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [{ id: "s1", status: "closed", closedAt: "2026-02-28T10:00:00Z" }],
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
    useEodClosureDataMock.mockReturnValue({ closure: null, loading: true, error: null });

    render(<EodChecklistContent />);

    expect(screen.queryByTestId("eod-variance-summary")).not.toBeInTheDocument();
  });

  it("TC-V06: yesterday's closed shift (different date) excluded from cashVariance sum", () => {
    useTillShiftsDataMock.mockReturnValue({
      shifts: [
        // yesterday's shift — closedAt doesn't start with 2026-02-28
        { id: "s0", status: "closed", closedAt: "2026-02-27T23:59:00Z", closeDifference: 100 },
        // today's shift
        { id: "s1", status: "closed", closedAt: "2026-02-28T10:00:00Z", closeDifference: 5 },
      ],
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
    useEodClosureDataMock.mockReturnValue({ closure: null, loading: false, error: null });

    render(<EodChecklistContent />);

    const summary = screen.getByTestId("eod-variance-summary");
    // Only today's shift (5) should be counted; yesterday's (100) excluded
    expect(summary).toHaveTextContent("€+5.00");
    expect(summary).not.toHaveTextContent("€+105");
  });

  // Variance banner display tests (TASK-04)

  it("TC-B01: closure with cashVariance and stockItemsCounted → banner shows both rows", () => {
    useEodClosureDataMock.mockReturnValue({
      closure: {
        date: "2026-02-28",
        timestamp: "2026-02-28T22:30:00.000+01:00",
        confirmedBy: "pete",
        cashVariance: -3.5,
        stockItemsCounted: 12,
      },
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    const banner = screen.getByTestId("day-closed-banner");
    expect(screen.getByTestId("eod-closure-cash-variance")).toBeInTheDocument();
    expect(screen.getByTestId("eod-closure-cash-variance")).toHaveTextContent("€-3.50");
    expect(screen.getByTestId("eod-closure-stock-items")).toBeInTheDocument();
    expect(screen.getByTestId("eod-closure-stock-items")).toHaveTextContent("12 items counted");
    expect(banner).toBeInTheDocument();
  });

  it("TC-B02: closure without new fields (legacy record) → banner shows confirmedBy and timestamp; no variance rows", () => {
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

    expect(screen.getByTestId("day-closed-banner")).toHaveTextContent("pete");
    expect(screen.queryByTestId("eod-closure-cash-variance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("eod-closure-stock-items")).not.toBeInTheDocument();
  });

  it("TC-B03: closure with cashVariance: 0 and stockItemsCounted: 0 → banner shows €+0.00 and 0 items counted", () => {
    useEodClosureDataMock.mockReturnValue({
      closure: {
        date: "2026-02-28",
        timestamp: "2026-02-28T22:30:00.000+01:00",
        confirmedBy: "pete",
        cashVariance: 0,
        stockItemsCounted: 0,
      },
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.getByTestId("eod-closure-cash-variance")).toHaveTextContent("€+0.00");
    expect(screen.getByTestId("eod-closure-stock-items")).toHaveTextContent("0 items counted");
  });

  it("TC-B04: closure with cashVariance only (no stockItemsCounted) → only cash variance row shown", () => {
    useEodClosureDataMock.mockReturnValue({
      closure: {
        date: "2026-02-28",
        timestamp: "2026-02-28T22:30:00.000+01:00",
        confirmedBy: "pete",
        cashVariance: 5.5,
      },
      loading: false,
      error: null,
    });

    render(<EodChecklistContent />);

    expect(screen.getByTestId("eod-closure-cash-variance")).toHaveTextContent("€+5.50");
    expect(screen.queryByTestId("eod-closure-stock-items")).not.toBeInTheDocument();
  });
});
