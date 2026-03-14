import "@testing-library/jest-dom";

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

interface LoadOpts {
  prepareData?: Partial<ReturnType<typeof defaultPrepareData>>;
  roomsData?: Record<string, string[]>;
  checkoutCounts?: Record<string, number>;
  prepareLoading?: boolean;
  occupantLoading?: boolean;
  checkoutLoading?: boolean;
  prepareError?: unknown;
  occupantError?: unknown;
  checkoutError?: unknown;
  noData?: boolean;
  saveRoomStatusImpl?: jest.Mock;
}

function defaultPrepareData() {
  return {
    mergedData: [] as Array<{
      roomNumber: string;
      finalCleanliness: "Clean" | "Dirty";
      occupantCount: number;
    }>,
    totalInRoomsYesterday: 0,
    totalCheckInsToday: 0,
    totalBeds: 0,
    occupancyRate: 0,
    totalFreeBeds: 0,
    isLoading: false,
    error: null as unknown,
    noRoomsData: false,
    noCheckinsData: false,
    roomStatusMap: null,
  };
}

async function loadComp(opts: LoadOpts = {}) {
  jest.resetModules();

  // Mock date utils so today is deterministic
  jest.doMock("../../../utils/dateUtils", () => ({
    getLocalYyyyMmDd: () => "2025-01-01",
    getLocalToday: () => "2025-01-01",
    isToday: (d: string) => d === "2025-01-01",
    getItalyIsoString: () => "2025-01-01T10:00:00+01:00",
  }));

  const saveRoomStatus = opts.saveRoomStatusImpl ?? jest.fn().mockResolvedValue(undefined);
  jest.doMock("../../../hooks/mutations/useRoomStatusMutations", () => ({
    __esModule: true,
    default: () => ({ saveRoomStatus }),
  }));

  const prepareReturn = { ...defaultPrepareData(), ...opts.prepareData };
  if (opts.prepareLoading) prepareReturn.isLoading = true;
  if (opts.prepareError) prepareReturn.error = opts.prepareError;
  if (opts.noData) {
    prepareReturn.noRoomsData = true;
    prepareReturn.noCheckinsData = true;
  }

  jest.doMock(
    "../../../hooks/orchestrations/prepare/usePrepareDashboard",
    () => ({
      __esModule: true,
      default: () => prepareReturn,
    })
  );

  jest.doMock(
    "../../../hooks/orchestrations/prepare/useInHouseGuestsByRoom",
    () => ({
      __esModule: true,
      default: () => ({
        roomsData: opts.roomsData ?? {},
        loading: opts.occupantLoading ?? false,
        error: opts.occupantError ?? null,
      }),
    })
  );

  jest.doMock(
    "../../../hooks/orchestrations/prepare/useCheckoutCountsByRoomForDate",
    () => ({
      __esModule: true,
      useCheckoutCountsByRoomForDate: () => ({
        checkoutCountsByRoom: opts.checkoutCounts ?? {},
        loading: opts.checkoutLoading ?? false,
        error: opts.checkoutError ?? null,
      }),
    })
  );

  jest.doMock("../../../context/AuthContext", () => ({
    useAuth: () => ({ user: { user_name: "alice" } }),
  }));

  // Simplify date selector rendering
  jest.doMock("../../common/DateSelector", () => ({
    __esModule: true,
    default: function Mock({ selectedDate }: { selectedDate: string }) {
      return <div data-testid="date-selector">{selectedDate}</div>;
    },
  }));

  const mod = await import("../PrepareDashboard");
  return mod.default;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PrepareDashboard", () => {
  it("shows loading state", async () => {
    const Comp = await loadComp({ prepareLoading: true });
    render(<Comp />);
    expect(screen.getByText(/loading data/i)).toBeInTheDocument();
  });

  it("shows error message", async () => {
    const Comp = await loadComp({ prepareError: new Error("oops") });
    render(<Comp />);
    expect(screen.getByText(/error: oops/i)).toBeInTheDocument();
  });

  it("shows no data message", async () => {
    const Comp = await loadComp({ noData: true });
    render(<Comp />);
    expect(
      screen.getByText(/no cleaning data found for this date/i)
    ).toBeInTheDocument();
  });

  it("renders table with data", async () => {
    const Comp = await loadComp({
      prepareData: {
        mergedData: [
          { roomNumber: "3", occupantCount: 0, finalCleanliness: "Clean" },
        ],
      },
      roomsData: { "3": ["o1", "o2"] },
      checkoutCounts: { "3": 1 },
    });
    render(<Comp />);
    expect(screen.getByText("PREPARE")).toBeInTheDocument();
    expect(screen.getByText("3", { selector: "td" })).toBeInTheDocument();
    expect(screen.getByText("2", { selector: "td" })).toBeInTheDocument();
    expect(screen.getByText("1", { selector: "td" })).toBeInTheDocument();
    expect(screen.getByText("Clean", { selector: "span" })).toBeInTheDocument();
  });

  it("renders Mark Clean button when isToday is true", async () => {
    const Comp = await loadComp({
      prepareData: {
        mergedData: [
          { roomNumber: "3", occupantCount: 0, finalCleanliness: "Dirty" },
        ],
      },
    });
    render(<Comp />);
    const btn = screen.getByRole("button", { name: /mark clean/i });
    expect(btn).toBeInTheDocument();
    expect(btn).not.toBeDisabled();
  });

  it("Mark Clean button calls saveRoomStatus with correct payload", async () => {
    const saveRoomStatus = jest.fn().mockResolvedValue(undefined);
    const Comp = await loadComp({
      prepareData: {
        mergedData: [
          { roomNumber: "3", occupantCount: 0, finalCleanliness: "Dirty" },
        ],
      },
      saveRoomStatusImpl: saveRoomStatus,
    });
    render(<Comp />);
    await userEvent.click(screen.getByRole("button", { name: /mark clean/i }));
    expect(saveRoomStatus).toHaveBeenCalledWith("index_3", {
      clean: "Yes",
      cleaned: "2025-01-01T10:00:00+01:00",
    });
  });

  it("Mark Clean buttons disabled during pending write (global write lock)", async () => {
    let resolveWrite: () => void;
    const saveRoomStatus = jest.fn().mockReturnValue(
      new Promise<void>((resolve) => { resolveWrite = resolve; })
    );
    const Comp = await loadComp({
      prepareData: {
        mergedData: [
          { roomNumber: "3", occupantCount: 0, finalCleanliness: "Dirty" },
          { roomNumber: "4", occupantCount: 0, finalCleanliness: "Dirty" },
        ],
      },
      saveRoomStatusImpl: saveRoomStatus,
    });
    render(<Comp />);
    const buttons = screen.getAllByRole("button", { name: /mark clean/i });
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[0]);
    // While write is pending, both buttons must be disabled
    buttons.forEach((btn) => expect(btn).toBeDisabled());
    // Resolve the write
    resolveWrite!();
  });
});
