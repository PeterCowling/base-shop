import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, beforeEach, afterEach, vi, expect } from "vitest";
import type { SalesOrder } from "../../../../types/bar/BarTypes";

import SalesScreen from "../SalesScreen";

// ---- Mocks ------------------------------------------------------------
let ordersMock: SalesOrder[] = [];
let loadingMock = false;
let errorMock: unknown = null;
let dbMock: unknown = null;

const {
  removeItemsMock,
  removeSingleItemMock,
  setBleeperAvailabilityMock,
  setMock,
  removeMock,
  refMock,
} = vi.hoisted(() => {
  return {
    removeItemsMock: vi.fn(),
    removeSingleItemMock: vi.fn(),
    setBleeperAvailabilityMock: vi.fn(),
    setMock: vi.fn().mockResolvedValue(null),
    removeMock: vi.fn().mockResolvedValue(null),
    refMock: vi.fn((db: unknown, path: string) => ({ db, path })),
  };
});

vi.mock("../../../../hooks/data/bar/useSalesOrders", () => ({
  useSalesOrders: () => ({ orders: ordersMock, loading: loadingMock, error: errorMock }),
}));

vi.mock("../../../../hooks/orchestrations/bar/actions/mutations/useOrderActions", () => ({
  useOrderActions: () => ({ removeItems: removeItemsMock, removeSingleItem: removeSingleItemMock }),
}));

vi.mock("../../../../hooks/mutations/useBleeperMutations", () => ({
  useBleeperMutations: () => ({ setBleeperAvailability: setBleeperAvailabilityMock }),
}));

vi.mock("../../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => dbMock,
}));

vi.mock("../../../../hooks/orchestrations/bar/actions/clientActions/useOrderAgeColor", () => ({
  useOrderAgeColor: () => "bg-test",
}));

vi.mock("firebase/database", () => ({ ref: refMock, set: setMock, remove: removeMock }));
// ----------------------------------------------------------------------

beforeEach(() => {
  ordersMock = [];
  loadingMock = false;
  errorMock = null;
  dbMock = null;
  removeItemsMock.mockReset();
  removeSingleItemMock.mockReset();
  setBleeperAvailabilityMock.mockReset();
  setMock.mockClear();
  removeMock.mockClear();
  refMock.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("SalesScreen", () => {
  it("renders loading state", () => {
    loadingMock = true;
    render(<SalesScreen />);
    expect(screen.getByText("Loading orders…")).toBeInTheDocument();
  });

  it("renders error state", () => {
    errorMock = new Error("fail");
    render(<SalesScreen />);
    expect(screen.getByText("No orders")).toBeInTheDocument();
  });

  it("renders empty list message", () => {
    render(<SalesScreen />);
    expect(screen.getByText("No orders")).toBeInTheDocument();
  });

  it("renders tickets for different payment types", () => {
    ordersMock = [
      {
        orderKey: "o1",
        confirmed: true,
        bleepNumber: "1",
        userName: "user1",
        time: "10:00",
        paymentMethod: "cash",
        items: [{ product: "Tea", count: 1 }],
      },
      {
        orderKey: "o2",
        confirmed: true,
        bleepNumber: "2",
        userName: "user2",
        time: "09:00",
        paymentMethod: "card",
        items: [{ product: "Coffee", count: 1 }],
      },
    ];
    render(<SalesScreen />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("handles removing items and recalls last order", async () => {
    const order: SalesOrder = {
      orderKey: "o1",
      confirmed: true,
      bleepNumber: "5",
      userName: "user",
      time: "12:00",
      paymentMethod: "cash",
      items: [{ product: "Beer", count: 1 }],
    };
    ordersMock = [order];
    removeItemsMock.mockResolvedValue(true);
    dbMock = {};
    render(<SalesScreen />);

    fireEvent.doubleClick(screen.getByText("5"));
    await waitFor(() => expect(setBleeperAvailabilityMock).toHaveBeenCalledWith(5, true));
    expect(screen.getByText("Recall")).not.toBeDisabled();

    fireEvent.click(screen.getByText("Recall"));
    await waitFor(() => {
      expect(setMock).toHaveBeenCalled();
      expect(removeMock).toHaveBeenCalled();
      expect(screen.getByText("Recall")).toBeDisabled();
    });
  });

  it("handles removing single item", async () => {
    const order: SalesOrder = {
      orderKey: "o2",
      confirmed: true,
      bleepNumber: "6",
      userName: "user",
      time: "13:00",
      paymentMethod: "cash",
      items: [
        { product: "Cola", count: 1 },
        { product: "Juice", count: 1 },
      ],
    };
    ordersMock = [order];
    removeSingleItemMock.mockResolvedValue(true);
    render(<SalesScreen />);

    fireEvent.doubleClick(screen.getByText("Cola"));
    await waitFor(() => expect(setBleeperAvailabilityMock).toHaveBeenCalledWith(6, true));
  });
});
