import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/* ------------------------------------------------------------------ */
/*  Mocks                                                             */
/* ------------------------------------------------------------------ */
const mockFindNextAvailableBleeper = vi.fn();
const mockSetBleeperAvailability = vi.fn();
const mockCreateSale = vi.fn();
const mockDeletePreorder = vi.fn();
const onValueMock = vi.fn();
const removeMock = vi.fn();

vi.mock("firebase/database", () => ({
  __esModule: true,
  getDatabase: vi.fn(),
  ref: vi.fn(),
  onValue: (...args: unknown[]) => onValueMock(...args),
  off: vi.fn(),
  remove: (...args: unknown[]) => removeMock(...args),
}));

vi.mock("../../../../../context/AuthContext", () => ({
  __esModule: true,
  useAuth: () => ({ user: { user_name: "Tester" } }),
}));

vi.mock("../../../../../hooks/data/bar/useBleepersData", () => ({
  __esModule: true,
  useBleepersData: () => ({
    bleepers: { 1: true },
    firstAvailableBleeper: 1,
    findNextAvailableBleeper: mockFindNextAvailableBleeper,
  }),
}));

vi.mock("../../../../../hooks/mutations/useBleeperMutations", () => ({
  __esModule: true,
  useBleeperMutations: () => ({
    setBleeperAvailability: mockSetBleeperAvailability,
  }),
}));

vi.mock(
  "../../../../../hooks/orchestrations/bar/actions/mutations/useConfirmOrder",
  () => ({
    __esModule: true,
    useConfirmOrder: () => ({ createSale: mockCreateSale }),
  })
);

vi.mock(
  "../../../../../hooks/orchestrations/bar/actions/mutations/useDeletePreorder",
  () => ({
    __esModule: true,
    useDeletePreorder: () => ({ deletePreorder: mockDeletePreorder }),
  })
);

vi.mock("../../../../../utils/dateUtils", async () => {
  const actual = await vi.importActual<
    typeof import("../../../../../utils/dateUtils")
  >("../../../../../utils/dateUtils");
  return {
    ...actual,
    getItalyLocalTimeHHMM: () => "09:15",
  };
});

import PreorderButtons from "../PreorderButtons";

function setupSnapshotWithOrder() {
  onValueMock.mockImplementation((ref, cb) => {
    cb({
      exists: () => true,
      val: () => ({
        txn1: {
          preorderTime: "08:30",
          firstName: "John",
          surname: "Doe",
          uuid: "abc",
          items: [
            { count: 1, lineType: "bds", price: 2, product: "Coffee" },
          ],
        },
      }),
    });
  });
}

function setupSnapshotEmpty() {
  onValueMock.mockImplementation((ref, cb) => {
    cb({ exists: () => false });
  });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2023-07-20T08:00:00+02:00"));
  onValueMock.mockReset();
  removeMock.mockReset();
  mockCreateSale.mockReset();
  mockDeletePreorder.mockReset();
  mockSetBleeperAvailability.mockReset();
  mockFindNextAvailableBleeper.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe("PreorderButtons", () => {
  it("logs complimentary order on click", async () => {
    setupSnapshotWithOrder();
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    render(<PreorderButtons />);
    const mainButton = await screen.findByText("08:30");
    const button = mainButton.closest("button");
    if (!button) throw new Error("Button not found");
    await userEvent.click(button);
    expect(logSpy).toHaveBeenCalledWith(
      "Complimentary order:",
      expect.objectContaining({ guestFirstName: "John", guestSurname: "Doe" })
    );
  });

  it("converts preorder to sale on double click", async () => {
    setupSnapshotWithOrder();
    mockCreateSale.mockResolvedValue("sale123");
    render(<PreorderButtons />);
    const mainButton = await screen.findByText("08:30");
    const button = mainButton.closest("button");
    if (!button) throw new Error("Button not found");
    await userEvent.dblClick(button);
    await waitFor(() => expect(mockCreateSale).toHaveBeenCalled());
    expect(mockSetBleeperAvailability).toHaveBeenCalledWith(1, false);
    expect(mockCreateSale.mock.calls[0][4]).toBe("09:15");
    expect(removeMock).toHaveBeenCalled();
  });

  it("handles errors during sale conversion", async () => {
    setupSnapshotWithOrder();
    mockCreateSale.mockRejectedValue(new Error("fail"));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<PreorderButtons />);
    const mainButton = await screen.findByText("08:30");
    const button = mainButton.closest("button");
    if (!button) throw new Error("Button not found");
    await userEvent.dblClick(button);
    await waitFor(() => expect(errSpy).toHaveBeenCalled());
    expect(removeMock).not.toHaveBeenCalled();
  });

  it("opens and confirms delete modal", async () => {
    setupSnapshotWithOrder();
    render(<PreorderButtons />);
    const deleteBtn = await screen.findByLabelText("Delete preorder");
    await userEvent.click(deleteBtn);
    expect(
      screen.getByText(/are you sure you want to delete this preorder/i)
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "No" }));
    expect(
      screen.queryByText(/are you sure you want to delete this preorder/i)
    ).not.toBeInTheDocument();
    expect(mockDeletePreorder).not.toHaveBeenCalled();
    await userEvent.click(deleteBtn);
    await userEvent.click(screen.getByRole("button", { name: "Yes" }));
    await waitFor(() =>
      expect(mockDeletePreorder).toHaveBeenCalledWith(
        "txn1",
        "breakfastPreorders",
        "July",
        "20"
      )
    );
  });

  it("renders nothing when no preorders exist", async () => {
    setupSnapshotEmpty();
    render(<PreorderButtons />);
    await waitFor(() => expect(onValueMock).toHaveBeenCalled());
    expect(screen.queryByRole("button")).toBeNull();
  });
});

