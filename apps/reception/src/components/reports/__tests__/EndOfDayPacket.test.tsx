import "@testing-library/jest-dom";
import { act, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

import type { CardIrregularity } from "../../../types/hooks/data/cardIrregularityData";
import type { KeycardDiscrepancy } from "../../../types/hooks/data/keycardDiscrepancyData";
import { getItalyIsoString } from "../../../utils/dateUtils";
import type { SafeCount } from "../../../types/hooks/data/safeCountData";
import type { Column } from "../SafeTable";
import SafeTableSection from "../SafeTableSection";
jest.mock("../../../utils/toastUtils", () => ({ showToast: jest.fn() }));
import { showToast } from "../../../utils/toastUtils";
const toastMock = showToast as unknown as jest.Mock;

const mockUseEndOfDayReportData = jest.fn();
const mockTillDataProvider = jest.fn();
const mockSafeDataProvider = jest.fn();
var getMock: jest.Mock;

const openingSnap = {
  exists: () => true,
  val: () => ({ id1: { type: "opening" } }),
};
const noSpecialSnap = {
  exists: () => true,
  val: () => ({ id1: { type: "deposit" } }),
};
const resetSnap = {
  exists: () => true,
  val: () => ({ id1: { type: "safeReset" } }),
};

jest.mock("../../../context/TillDataContext", () => ({
  TillDataProvider: ({
    children,
    reportDate,
  }: {
    children: ReactNode;
    reportDate?: Date;
  }) => {
    mockTillDataProvider({ children, reportDate });
    return <div>{children}</div>;
  },
}));

jest.mock("../../../context/SafeDataContext", () => ({
  SafeDataProvider: ({
    children,
    startAt,
    endAt,
  }: {
    children: ReactNode;
    startAt?: string;
    endAt?: string;
  }) => {
    mockSafeDataProvider({ children, startAt, endAt });
    return <div>{children}</div>;
  },
}));

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

jest.mock("firebase/database", () => {
  getMock = jest.fn();
  return {
    ref: jest.fn((db: unknown, path: string) => ({ path })),
    query: jest.fn((refObj: unknown, ...rest: unknown[]) => ({ ref: refObj, rest })),
    orderByChild: jest.fn((field: string) => ({ op: "orderByChild", field })),
    startAt: jest.fn((val: unknown) => ({ op: "startAt", val })),
    endAt: jest.fn((val: unknown) => ({ op: "endAt", val })),
    get: (...args: unknown[]) => getMock(...args),
  };
});

jest.mock("../../../hooks/data/useEndOfDayReportData", () => ({
  useEndOfDayReportData: (date: Date) => mockUseEndOfDayReportData(date),
}));

import EndOfDayPacket, { EndOfDayPacketContent } from "../EndOfDayPacket";

const baseReturn = {
  targetDateStr: "2024-01-01",
  isLoading: false,
  tillError: null,
  cashDiscError: null,
  keycardDiscError: null,
  ccError: null,
  safeError: null,
  keycardTransfersError: null,
  totals: { cash: 0, card: 0, other: 0 },
  todaysIrregularities: [] as CardIrregularity[],
  todaysKeycardDiscrepancies: [] as KeycardDiscrepancy[],
  keycardDiscrepancyTotal: 0,
  bankDrops: { rows: [], total: 0 },
  bankWithdrawals: { rows: [], total: 0 },
  deposits: { rows: [], total: 0 },
  withdrawals: { rows: [], total: 0 },
  pettyWithdrawals: { rows: [], total: 0 },
  drawerToSafeExchanges: { rows: [], total: 0 },
  safeToDrawerExchanges: { rows: [], total: 0 },
  todaysSafeReconciles: [],
  todaysSafeResets: [],
  reconcilesTotal: 0,
  safeInflowsTotal: 0,
  safeOutflowsTotal: 0,
  safeKeycardInflowsTotal: 0,
  safeKeycardOutflowsTotal: 0,
  keycardTransfersToSafe: { rows: [], total: 0 },
  keycardTransfersFromSafe: { rows: [], total: 0 },
  keycardReconcileAdjustment: 0,
  tenderRemovalTotal: 0,
  todaysCreditSlips: [],
  discrepancySummary: {},
  openingCash: 0,
  expectedCash: 0,
  closingCash: 0,
  variance: 0,
  openingKeycards: 0,
  expectedKeycards: 0,
  closingKeycards: 0,
  keycardVariance: 0,
  keycardVarianceMismatch: false,
  beginningSafeBalance: 0,
  endingSafeBalance: 0,
  expectedSafeVariance: 0,
  safeVariance: 0,
  safeVarianceMismatch: false,
  safeInflowsMismatch: false,
};

beforeEach(() => {
  mockUseEndOfDayReportData.mockReturnValue(baseReturn);
  mockUseEndOfDayReportData.mockClear();
  mockTillDataProvider.mockClear();
  mockSafeDataProvider.mockClear();
  getMock.mockReset();
  toastMock.mockReset();
});

describe("EndOfDayPacketContent", () => {
  it("shows loading placeholder while data loads", () => {
    mockUseEndOfDayReportData.mockReturnValue({
      ...baseReturn,
      isLoading: true,
    });
    render(<EndOfDayPacketContent date={new Date("2024-01-01T00:00:00Z")} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders keycard transfer error", () => {
    mockUseEndOfDayReportData.mockReturnValue({
      ...baseReturn,
      keycardTransfersError: new Error("fail"),
    });
    render(<EndOfDayPacketContent date={new Date("2024-01-01T00:00:00Z")} />);
    expect(
      screen.getByText("Error loading keycard transfers")
    ).toBeInTheDocument();
  });

  it("shows separate safe keycard counts and transfers", () => {
    mockUseEndOfDayReportData.mockReturnValue({
      ...baseReturn,
      safeKeycardInflowsTotal: 5,
      safeKeycardOutflowsTotal: 2,
      keycardTransfersToSafe: { rows: [], total: 3 },
      keycardTransfersFromSafe: { rows: [], total: 4 },
    });
    render(<EndOfDayPacketContent date={new Date("2024-01-01T00:00:00Z")} />);
    expect(screen.getByText("Safe Inflows").closest("tr")).toHaveTextContent("5");
    expect(screen.getByText("Transfers to Safe").closest("tr")).toHaveTextContent(
      "3"
    );
    expect(screen.getByText("Safe Outflows").closest("tr")).toHaveTextContent(
      "2"
    );
    expect(screen.getByText("Transfers from Safe").closest("tr")).toHaveTextContent(
      "4"
    );
  });

  it("renders daily totals from hook", () => {
    mockUseEndOfDayReportData.mockReturnValue({
      ...baseReturn,
      totals: { cash: 30, card: 40, other: 50 },
    });
    render(<EndOfDayPacketContent date={new Date("2024-01-01T00:00:00Z")} />);
    expect(screen.getByText("Cash:").parentElement?.textContent).toContain("€30.00");
    expect(screen.getByText("Card:").parentElement?.textContent).toContain("€40.00");
    expect(screen.getByText("Other:").parentElement?.textContent).toContain("€50.00");
  });

  it("renders keycard discrepancies with totals", () => {
    mockUseEndOfDayReportData.mockReturnValue({
      ...baseReturn,
      todaysKeycardDiscrepancies: [
        { user: "u1", timestamp: "2024-01-01T10:00:00Z", amount: 1 },
      ],
      keycardDiscrepancyTotal: 1,
    });
    render(<EndOfDayPacketContent date={new Date("2024-01-01T00:00:00Z")} />);
    expect(
      screen.getByText("Keycard Discrepancies (Total: 1)")
    ).toBeInTheDocument();
    expect(screen.getByText("u1")).toBeInTheDocument();
  });

  it("shows keycard variance when mismatch", () => {
    mockUseEndOfDayReportData.mockReturnValue({
      ...baseReturn,
      expectedKeycards: 1,
      closingKeycards: 3,
      keycardVariance: 2,
      keycardVarianceMismatch: true,
    });
    render(<EndOfDayPacketContent date={new Date("2024-01-01T00:00:00Z")} />);
    const msg = screen.getAllByText(/keycard variance/i)[0];
    expect(msg).toHaveTextContent("expected 1 vs actual 3 (Δ+2)");
    expect(msg).toHaveClass("text-error-main");
  });

  it("renders keycard movement summary", () => {
    mockUseEndOfDayReportData.mockReturnValue({
      ...baseReturn,
      safeKeycardInflowsTotal: 3,
      safeKeycardOutflowsTotal: 1,
      keycardTransfersToSafe: { rows: [], total: 2 },
      keycardTransfersFromSafe: { rows: [], total: 1 },
      keycardReconcileAdjustment: 1,
      expectedKeycards: 5,
      closingKeycards: 6,
      keycardVariance: 1,
      keycardVarianceMismatch: true,
    });
    render(<EndOfDayPacketContent date={new Date("2024-01-01T00:00:00Z")} />);
    expect(screen.getByText("Keycard Movements")).toBeInTheDocument();
    expect(
      screen.getByText("Safe Inflows").parentElement?.textContent
    ).toContain("3");
    expect(
      screen.getByText("Transfers to Safe").parentElement?.textContent
    ).toContain("2");
    expect(
      screen.getByText("Safe Outflows").parentElement?.textContent
    ).toContain("1");
    expect(
      screen.getByText("Transfers from Safe").parentElement?.textContent
    ).toContain("1");
    expect(
      screen.getByText("Reconcile Adjustment").parentElement?.textContent
    ).toContain("1");
    expect(
      screen.getAllByText("Variance")[0].nextElementSibling
    ).toHaveClass("text-error-main");
  });

  it("renders keycard transfer sections with totals", () => {
    mockUseEndOfDayReportData.mockReturnValue({
      ...baseReturn,
      keycardTransfersToSafe: {
        rows: [
          {
            user: "alice",
            timestamp: "2024-01-01T10:00:00Z",
            count: 2,
            direction: "toSafe",
          },
        ],
        total: 2,
      },
      keycardTransfersFromSafe: {
        rows: [
          {
            user: "bob",
            timestamp: "2024-01-01T11:00:00Z",
            count: 1,
            direction: "fromSafe",
          },
        ],
        total: 1,
      },
    });
    render(<EndOfDayPacketContent date={new Date("2024-01-01T00:00:00Z")} />);
    expect(
      screen.getByText("Keycard Transfers to Safe (Total: 2)")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Keycard Transfers from Safe (Total: 1)")
    ).toBeInTheDocument();
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(screen.getByText("bob")).toBeInTheDocument();
  });

  it("renders safe resets section", () => {
    mockUseEndOfDayReportData.mockReturnValue({
      ...baseReturn,
      todaysSafeResets: [
        {
          user: "u1",
          timestamp: "2024-01-01T10:00:00Z",
          type: "safeReset",
          count: 100,
          difference: 0,
        },
      ],
    });
    render(<EndOfDayPacketContent date={new Date("2024-01-01T00:00:00Z")} />);
    expect(screen.getByText("Safe Resets")).toBeInTheDocument();
    expect(screen.getByText("u1")).toBeInTheDocument();
  });

  it("renders exchange sections with totals", () => {
    mockUseEndOfDayReportData.mockReturnValue({
      ...baseReturn,
      drawerToSafeExchanges: {
        rows: [
          {
            id: "d1",
            user: "x",
            timestamp: "2024-01-01T10:00:00Z",
            type: "exchange",
            amount: 10,
            direction: "drawerToSafe",
          },
        ],
        total: 10,
      },
      safeToDrawerExchanges: {
        rows: [
          {
            id: "s1",
            user: "y",
            timestamp: "2024-01-01T11:00:00Z",
            type: "exchange",
            amount: 5,
            direction: "safeToDrawer",
          },
        ],
        total: 5,
      },
      bankWithdrawals: { rows: [], total: 5 },
      safeInflowsTotal: 10,
      tenderRemovalTotal: 5,
    });
    render(<EndOfDayPacketContent date={new Date("2024-01-01T00:00:00Z")} />);
    expect(
      screen.getByText("Drawer to Safe Exchanges (Total: €10.00)")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Safe to Drawer Exchanges (Total: €5.00)")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Safe Inflows (excl. Bank Withdrawals) vs Tender Removals: €5.00 vs €5.00"
      )
    ).toBeInTheDocument();
  });
});

describe("EndOfDayPacket", () => {
  const dayMs = 24 * 60 * 60 * 1000;

  it("passes Italian date range to providers", async () => {
    getMock.mockImplementation(async () => openingSnap);
    const date = new Date("2024-02-10T12:00:00Z");
    render(<EndOfDayPacket date={date} />);
    await waitFor(() => expect(mockSafeDataProvider).toHaveBeenCalled());
    expect(mockTillDataProvider.mock.calls[0][0].reportDate).toBe(date);

    const safeProps = mockSafeDataProvider.mock.calls[0][0];
    const italyDate = getItalyIsoString(date).slice(0, 10);
    const lookback = new Date(date.getTime() - 7 * dayMs);
    const expectedStartAt = `${
      getItalyIsoString(lookback).slice(0, 10)
    }T00:00:00.000+00:00`;
    const expectedEndAt = `${italyDate}T23:59:59.000+00:00`;

    expect(safeProps.startAt).toBe(expectedStartAt);
    expect(safeProps.endAt).toBe(expectedEndAt);
  });

  it("uses correct range on DST start", async () => {
    getMock.mockImplementation(async () => openingSnap);
    const date = new Date("2024-03-31T12:00:00Z");
    render(<EndOfDayPacket date={date} />);
    await waitFor(() => expect(mockSafeDataProvider).toHaveBeenCalled());
    const safeProps = mockSafeDataProvider.mock.calls[0][0];
    const italyDate = getItalyIsoString(date).slice(0, 10);
    const lookback = new Date(date.getTime() - 7 * dayMs);
    expect(safeProps.startAt).toBe(
      `${getItalyIsoString(lookback).slice(0, 10)}T00:00:00.000+00:00`
    );
    expect(safeProps.endAt).toBe(`${italyDate}T23:59:59.000+00:00`);
  });

  it("uses correct range on DST end", async () => {
    getMock.mockImplementation(async () => openingSnap);
    const date = new Date("2024-10-27T12:00:00Z");
    render(<EndOfDayPacket date={date} />);
    await waitFor(() => expect(mockSafeDataProvider).toHaveBeenCalled());
    const safeProps = mockSafeDataProvider.mock.calls[0][0];
    const italyDate = getItalyIsoString(date).slice(0, 10);
    const lookback = new Date(date.getTime() - 7 * dayMs);
    expect(safeProps.startAt).toBe(
      `${getItalyIsoString(lookback).slice(0, 10)}T00:00:00.000+00:00`
    );
    expect(safeProps.endAt).toBe(`${italyDate}T23:59:59.000+00:00`);
  });

  it("allows custom safe lookback period", async () => {
    getMock.mockImplementation(async () => openingSnap);
    const date = new Date("2024-02-10T12:00:00Z");
    render(<EndOfDayPacket date={date} safeLookbackDays={3} />);
    await waitFor(() => expect(mockSafeDataProvider).toHaveBeenCalled());
    const safeProps = mockSafeDataProvider.mock.calls[0][0];
    const customLookback = new Date(date.getTime() - 3 * dayMs);
    expect(safeProps.startAt).toBe(
      `${getItalyIsoString(customLookback).slice(0, 10)}T00:00:00.000+00:00`
    );
  });

  it("extends lookback when opening outside initial window", async () => {
    getMock
      .mockImplementationOnce(async () => noSpecialSnap)
      .mockImplementationOnce(async () => openingSnap)
      .mockImplementation(async () => openingSnap);
    const date = new Date("2024-02-10T12:00:00Z");
    render(<EndOfDayPacket date={date} />);
    await waitFor(() => expect(mockSafeDataProvider).toHaveBeenCalled());
    const safeProps = mockSafeDataProvider.mock.calls[0][0];
    const lookback = new Date(date.getTime() - 14 * dayMs);
    expect(safeProps.startAt).toBe(
      `${getItalyIsoString(lookback).slice(0, 10)}T00:00:00.000+00:00`
    );
  });

  it("doubles lookback until reset found", async () => {
    getMock
      .mockImplementationOnce(async () => noSpecialSnap)
      .mockImplementationOnce(async () => noSpecialSnap)
      .mockImplementationOnce(async () => resetSnap)
      .mockImplementation(async () => resetSnap);
    const date = new Date("2024-02-10T12:00:00Z");
    render(<EndOfDayPacket date={date} />);
    await waitFor(() => expect(mockSafeDataProvider).toHaveBeenCalled());
    const safeProps = mockSafeDataProvider.mock.calls[0][0];
    const lookback = new Date(date.getTime() - 28 * dayMs);
    expect(safeProps.startAt).toBe(
      `${getItalyIsoString(lookback).slice(0, 10)}T00:00:00.000+00:00`
    );
  });

  it("does not recompute data on parent re-render", async () => {
    getMock.mockResolvedValue(openingSnap);
    const { rerender } = render(<EndOfDayPacket />);
    await waitFor(() => expect(mockUseEndOfDayReportData).toHaveBeenCalledTimes(1));
    act(() => {
      rerender(<EndOfDayPacket />);
    });
    expect(mockUseEndOfDayReportData).toHaveBeenCalledTimes(1);
  });

  it("shows error toast and aborts when safe count fetch fails", async () => {
    getMock.mockRejectedValue(new Error("fail"));
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      render(<EndOfDayPacket />);
      await waitFor(() =>
        expect(toastMock).toHaveBeenCalledWith(
          "Failed to load safe data for report",
          "error"
        )
      );
      expect(mockSafeDataProvider).not.toHaveBeenCalled();
    } finally {
      errorSpy.mockRestore();
    }
  });
});

describe("SafeTableSection", () => {
  it("renders duplicate timestamps without key warnings", () => {
    const columns: Column<SafeCount>[] = [
      { header: "Time", render: (r) => r.timestamp },
    ];
    const rows: SafeCount[] = [
      { user: "u1", timestamp: "2024-01-01T10:00:00Z", type: "deposit" },
      { user: "u2", timestamp: "2024-01-01T10:00:00Z", type: "withdrawal" },
    ];
    const spy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(
      <SafeTableSection
        title="Test"
        rows={rows}
        columns={columns}
        emptyMessage="No rows"
      />
    );

    expect(spy).not.toHaveBeenCalledWith(
      expect.stringContaining("Encountered two children with the same key")
    );
    spy.mockRestore();
  });
});
