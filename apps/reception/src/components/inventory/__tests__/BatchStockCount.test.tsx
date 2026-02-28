import "@testing-library/jest-dom";

import { act, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import * as rolesLib from "../../../lib/roles";
import type { InventoryItem } from "../../../types/hooks/data/inventoryItemData";
import BatchStockCount, {
  groupItemsByCategory,
  requiresReauth,
} from "../BatchStockCount";

/* eslint-disable no-var */
var useInventoryItemsMock: jest.Mock;
var useInventoryLedgerMock: jest.Mock;
var useInventoryLedgerMutationsMock: jest.Mock;
var useBatchCountProgressMock: jest.Mock;
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

jest.mock("../../../hooks/mutations/useInventoryLedgerMutations", () => {
  useInventoryLedgerMutationsMock = jest.fn();
  return { useInventoryLedgerMutations: useInventoryLedgerMutationsMock };
});

jest.mock("../../../utils/inventoryLedger", () => ({
  buildInventorySnapshot: jest.fn((itemsById) => {
    return Object.fromEntries(
      Object.entries(itemsById).map(([id, item]) => [id, { onHand: (item as InventoryItem).openingCount ?? 0 }])
    );
  }),
}));

jest.mock("../../../services/useFirebase", () => ({
  useFirebaseDatabase: () => ({}),
}));

jest.mock("firebase/database", () => ({
  ref: jest.fn(),
  onValue: jest.fn((_ref, callback) => {
    callback({ val: () => true });
    return jest.fn();
  }),
}));

jest.mock("../../common/PasswordReauthModal", () => ({
  __esModule: true,
  default: ({
    onSuccess,
    onCancel,
  }: {
    onSuccess: () => void | Promise<void>;
    onCancel: () => void;
  }) => (
    <div data-cy="password-reauth-modal">
      <button data-cy="reauth-confirm" onClick={() => void onSuccess()}>
        Confirm
      </button>
      <button data-cy="reauth-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

jest.mock("../../../hooks/utilities/useBatchCountProgress", () => {
  useBatchCountProgressMock = jest.fn();
  return { __esModule: true, default: useBatchCountProgressMock };
});

function makeItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    id: "item-1",
    name: "Test Item",
    unit: "pz",
    openingCount: 5,
    category: "Bar",
    active: true,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();

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
  useInventoryLedgerMutationsMock.mockReturnValue({
    addLedgerEntry: jest.fn().mockResolvedValue(undefined),
  });
  useBatchCountProgressMock.mockReturnValue({
    progress: null,
    saveProgress: jest.fn(),
    clearProgress: jest.fn(),
  });
});

function renderBatchStockCount() {
  const onComplete = jest.fn();
  render(<BatchStockCount onComplete={onComplete} />);
  return { onComplete };
}

describe("groupItemsByCategory", () => {
  it("groups items by category", () => {
    const barItem = makeItem({ id: "bar-1", name: "Gin", category: "Bar" });
    const kitchenItem = makeItem({
      id: "kitchen-1",
      name: "Pasta",
      category: "Cucina",
    });

    const grouped = groupItemsByCategory([barItem, kitchenItem]);

    expect(Object.keys(grouped)).toEqual(expect.arrayContaining(["Bar", "Cucina"]));
    expect(grouped.Bar).toEqual([barItem]);
    expect(grouped.Cucina).toEqual([kitchenItem]);
  });

  it("puts null or undefined category items under Uncategorized", () => {
    const nullCategory = makeItem({
      id: "item-null",
      name: "No Cat 1",
      category: undefined,
    });
    const blankCategory = makeItem({
      id: "item-blank",
      name: "No Cat 2",
      category: "   ",
    });

    const grouped = groupItemsByCategory([nullCategory, blankCategory]);

    expect(grouped["Uncategorized"]).toEqual([nullCategory, blankCategory]);
  });

  it("handles mixed categorized and uncategorized items", () => {
    const barItem = makeItem({ id: "bar-2", name: "Rum", category: "Bar" });
    const kitchenItem = makeItem({
      id: "kitchen-2",
      name: "Flour",
      category: "Cucina",
    });
    const uncategorizedItem = makeItem({
      id: "none-1",
      name: "Misc",
      category: undefined,
    });

    const grouped = groupItemsByCategory([barItem, kitchenItem, uncategorizedItem]);

    expect(grouped.Bar).toEqual([barItem]);
    expect(grouped.Cucina).toEqual([kitchenItem]);
    expect(grouped["Uncategorized"]).toEqual([uncategorizedItem]);
  });
});

describe("requiresReauth", () => {
  it("returns true when delta exceeds threshold", () => {
    expect(requiresReauth([12], 10)).toBe(true);
  });

  it("returns false when all deltas are below threshold", () => {
    expect(requiresReauth([5, 3, -2], 10)).toBe(false);
  });

  it("returns true for large negative delta", () => {
    expect(requiresReauth([-11], 10)).toBe(true);
  });

  it("returns false for empty deltas", () => {
    expect(requiresReauth([], 10)).toBe(false);
  });
});

describe("BatchStockCount component", () => {
  it("renders loading state", () => {
    useInventoryItemsMock.mockReturnValue({
      items: [],
      itemsById: {},
      loading: true,
      error: null,
    });

    renderBatchStockCount();

    expect(screen.getByText("Loading inventory...")).toBeInTheDocument();
  });

  it("renders error state", () => {
    useInventoryItemsMock.mockReturnValue({
      items: [],
      itemsById: {},
      loading: false,
      error: new Error("failed"),
    });

    renderBatchStockCount();

    expect(
      screen.getByText("Error loading inventory.")
    ).toBeInTheDocument();
  });

  it("returns null when user has no stock access", () => {
    const canAccessSpy = jest.spyOn(rolesLib, "canAccess").mockReturnValue(false);
    const { container } = render(<BatchStockCount onComplete={jest.fn()} />);

    expect(container.firstChild).toBeNull();

    canAccessSpy.mockRestore();
  });

  it("shows category sections for Bar and Cucina", () => {
    const barItem = makeItem({ id: "bar-1", name: "Gin", category: "Bar" });
    const kitchenItem = makeItem({
      id: "kitchen-1",
      name: "Pasta",
      category: "Cucina",
    });

    useInventoryItemsMock.mockReturnValue({
      items: [barItem, kitchenItem],
      itemsById: {
        "bar-1": barItem,
        "kitchen-1": kitchenItem,
      },
      loading: false,
      error: null,
    });

    renderBatchStockCount();

    expect(screen.getByRole("heading", { name: "Bar" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Cucina" })).toBeInTheDocument();
  });

  it("shows Uncategorized heading for item without category", () => {
    const uncategorizedItem = makeItem({
      id: "uncat-1",
      name: "Unknown",
      category: undefined,
    });

    useInventoryItemsMock.mockReturnValue({
      items: [uncategorizedItem],
      itemsById: { "uncat-1": uncategorizedItem },
      loading: false,
      error: null,
    });

    renderBatchStockCount();

    expect(screen.getByRole("heading", { name: "Uncategorized" })).toBeInTheDocument();
  });

  it("submits positive count delta without reauth", async () => {
    const user = userEvent.setup();
    const addLedgerEntry = jest.fn().mockResolvedValue(undefined);
    const item = makeItem({
      id: "item-1",
      name: "Beans",
      openingCount: 8,
      category: "Bar",
    });

    useInventoryItemsMock.mockReturnValue({
      items: [item],
      itemsById: { "item-1": item },
      loading: false,
      error: null,
    });
    useInventoryLedgerMutationsMock.mockReturnValue({ addLedgerEntry });

    renderBatchStockCount();

    const row = screen.getByText("Beans").closest("tr") as HTMLElement;
    const quantityInput = within(row).getByRole("spinbutton");
    await user.clear(quantityInput);
    await user.type(quantityInput, "10");
    await user.click(screen.getByRole("button", { name: "Complete category" }));

    await waitFor(() => {
      expect(addLedgerEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: "item-1",
          type: "count",
          quantity: 2,
          reason: "conteggio batch",
        })
      );
    });
  });

  it("submits negative count delta without reauth", async () => {
    const user = userEvent.setup();
    const addLedgerEntry = jest.fn().mockResolvedValue(undefined);
    const item = makeItem({
      id: "item-1",
      name: "Beans",
      openingCount: 8,
      category: "Bar",
    });

    useInventoryItemsMock.mockReturnValue({
      items: [item],
      itemsById: { "item-1": item },
      loading: false,
      error: null,
    });
    useInventoryLedgerMutationsMock.mockReturnValue({ addLedgerEntry });

    renderBatchStockCount();

    const row = screen.getByText("Beans").closest("tr") as HTMLElement;
    const quantityInput = within(row).getByRole("spinbutton");
    await user.clear(quantityInput);
    await user.type(quantityInput, "5");
    await user.click(screen.getByRole("button", { name: "Complete category" }));

    await waitFor(() => {
      expect(addLedgerEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: "item-1",
          type: "count",
          quantity: -3,
        })
      );
    });
  });

  it("does not submit items with no entered quantity", async () => {
    const user = userEvent.setup();
    const addLedgerEntry = jest.fn().mockResolvedValue(undefined);
    const item = makeItem({
      id: "item-1",
      name: "Beans",
      openingCount: 8,
      category: "Bar",
    });

    useInventoryItemsMock.mockReturnValue({
      items: [item],
      itemsById: { "item-1": item },
      loading: false,
      error: null,
    });
    useInventoryLedgerMutationsMock.mockReturnValue({ addLedgerEntry });

    renderBatchStockCount();

    await user.click(screen.getByRole("button", { name: "Complete category" }));

    await waitFor(() => {
      expect(addLedgerEntry).not.toHaveBeenCalled();
    });
  });

  it("shows variance summary table after category submit", async () => {
    const user = userEvent.setup();
    const addLedgerEntry = jest.fn().mockResolvedValue(undefined);
    const item = makeItem({
      id: "item-1",
      name: "Beans",
      openingCount: 8,
      category: "Bar",
    });

    useInventoryItemsMock.mockReturnValue({
      items: [item],
      itemsById: { "item-1": item },
      loading: false,
      error: null,
    });
    useInventoryLedgerMutationsMock.mockReturnValue({ addLedgerEntry });

    renderBatchStockCount();

    const row = screen.getByText("Beans").closest("tr") as HTMLElement;
    const quantityInput = within(row).getByRole("spinbutton");
    await user.clear(quantityInput);
    await user.type(quantityInput, "10");
    await user.click(screen.getByRole("button", { name: "Complete category" }));

    await waitFor(() => {
      expect(screen.getAllByText("Beans").length).toBeGreaterThan(1);
    });

    expect(screen.getAllByText("8").length).toBeGreaterThan(0);
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("shows progress indicator for completed categories", async () => {
    const user = userEvent.setup();
    const addLedgerEntry = jest.fn().mockResolvedValue(undefined);
    const barItem = makeItem({
      id: "bar-1",
      name: "Gin",
      openingCount: 3,
      category: "Bar",
    });
    const kitchenItem = makeItem({
      id: "kitchen-1",
      name: "Pasta",
      openingCount: 6,
      category: "Cucina",
    });

    useInventoryItemsMock.mockReturnValue({
      items: [barItem, kitchenItem],
      itemsById: {
        "bar-1": barItem,
        "kitchen-1": kitchenItem,
      },
      loading: false,
      error: null,
    });
    useInventoryLedgerMutationsMock.mockReturnValue({ addLedgerEntry });

    renderBatchStockCount();

    const barSection = screen.getByRole("heading", { name: "Bar" }).closest("section") as HTMLElement;
    const row = within(barSection).getByText("Gin").closest("tr") as HTMLElement;
    const quantityInput = within(row).getByRole("spinbutton");
    await user.clear(quantityInput);
    await user.type(quantityInput, "3");
    await user.click(within(barSection).getByRole("button", { name: "Complete category" }));

    await waitFor(() => {
      expect(screen.getByText("1 / 2 categories complete")).toBeInTheDocument();
    });
  });

  it("restores saved quantities from session progress", async () => {
    const item = makeItem({
      id: "item-1",
      name: "Beans",
      openingCount: 8,
      category: "Bar",
    });

    useInventoryItemsMock.mockReturnValue({
      items: [item],
      itemsById: { "item-1": item },
      loading: false,
      error: null,
    });
    useBatchCountProgressMock.mockReturnValue({
      progress: {
        categoriesComplete: [],
        enteredQuantities: {
          "item-1": 12,
        },
      },
      saveProgress: jest.fn(),
      clearProgress: jest.fn(),
    });

    renderBatchStockCount();

    const row = screen.getByText("Beans").closest("tr") as HTMLElement;
    const quantityInput = within(row).getByRole("spinbutton");

    await waitFor(() => {
      expect(quantityInput).toHaveValue(12);
    });
  });

  it("shows reauth modal for large variance and defers submit", async () => {
    const user = userEvent.setup();
    const addLedgerEntry = jest.fn().mockResolvedValue(undefined);
    const item = makeItem({
      id: "item-1",
      name: "Beans",
      openingCount: 3,
      category: "Bar",
    });

    useInventoryItemsMock.mockReturnValue({
      items: [item],
      itemsById: { "item-1": item },
      loading: false,
      error: null,
    });
    useInventoryLedgerMutationsMock.mockReturnValue({ addLedgerEntry });

    renderBatchStockCount();

    const row = screen.getByText("Beans").closest("tr") as HTMLElement;
    const quantityInput = within(row).getByRole("spinbutton");
    await user.clear(quantityInput);
    await user.type(quantityInput, "15");
    await user.click(screen.getByRole("button", { name: "Complete category" }));

    expect(screen.getByTestId("password-reauth-modal")).toBeInTheDocument();
    expect(addLedgerEntry).not.toHaveBeenCalled();
  });

  it("submits directly when variance does not require reauth", async () => {
    const user = userEvent.setup();
    const addLedgerEntry = jest.fn().mockResolvedValue(undefined);
    const item = makeItem({
      id: "item-1",
      name: "Beans",
      openingCount: 5,
      category: "Bar",
    });

    useInventoryItemsMock.mockReturnValue({
      items: [item],
      itemsById: { "item-1": item },
      loading: false,
      error: null,
    });
    useInventoryLedgerMutationsMock.mockReturnValue({ addLedgerEntry });

    renderBatchStockCount();

    const row = screen.getByText("Beans").closest("tr") as HTMLElement;
    const quantityInput = within(row).getByRole("spinbutton");
    await user.clear(quantityInput);
    await user.type(quantityInput, "7");
    await user.click(screen.getByRole("button", { name: "Complete category" }));

    await waitFor(() => {
      expect(addLedgerEntry).toHaveBeenCalledWith(
        expect.objectContaining({
          itemId: "item-1",
          type: "count",
          quantity: 2,
        })
      );
    });
    expect(screen.queryByTestId("password-reauth-modal")).not.toBeInTheDocument();
  });

  it("keeps entered quantity and does not submit when reauth is canceled", async () => {
    const user = userEvent.setup();
    const addLedgerEntry = jest.fn().mockResolvedValue(undefined);
    const item = makeItem({
      id: "item-1",
      name: "Beans",
      openingCount: 3,
      category: "Bar",
    });

    useInventoryItemsMock.mockReturnValue({
      items: [item],
      itemsById: { "item-1": item },
      loading: false,
      error: null,
    });
    useInventoryLedgerMutationsMock.mockReturnValue({ addLedgerEntry });

    renderBatchStockCount();

    const row = screen.getByText("Beans").closest("tr") as HTMLElement;
    const quantityInput = within(row).getByRole("spinbutton");
    await user.clear(quantityInput);
    await user.type(quantityInput, "15");
    await user.click(screen.getByRole("button", { name: "Complete category" }));

    await user.click(screen.getByTestId("reauth-cancel"));

    expect(addLedgerEntry).not.toHaveBeenCalled();
    expect(quantityInput).toHaveValue(15);
  });
});

describe("useBatchCountProgress hook", () => {
  const getHook = () => {
    const actual = jest.requireActual("../../../hooks/utilities/useBatchCountProgress") as {
      default: (userId: string, date: string) => {
        progress: {
          categoriesComplete: string[];
          enteredQuantities: Record<string, number>;
        } | null;
        saveProgress: (data: {
          categoriesComplete: string[];
          enteredQuantities: Record<string, number>;
        }) => void;
        clearProgress: () => void;
      };
    };

    return actual.default;
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it("saves progress to localStorage with sessionDate", () => {
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");
    const actualUseBatchCountProgress = getHook();
    const data = {
      categoriesComplete: ["Bar"],
      enteredQuantities: { "item-1": 12 },
    };

    const { result } = renderHook(() =>
      actualUseBatchCountProgress("user-1", "2026-02-28")
    );

    act(() => {
      result.current.saveProgress(data);
    });

    expect(setItemSpy).toHaveBeenCalledTimes(1);
    expect(setItemSpy).toHaveBeenCalledWith(
      "batchCount-user-1-2026-02-28",
      expect.any(String)
    );

    const payload = JSON.parse(setItemSpy.mock.calls[0][1] as string);
    expect(payload).toEqual({
      sessionDate: "2026-02-28",
      data,
    });
  });

  it("restores progress after save when remounted with same user and date", async () => {
    const actualUseBatchCountProgress = getHook();
    const data = {
      categoriesComplete: ["Bar"],
      enteredQuantities: { "item-1": 8 },
    };

    const { result, unmount } = renderHook(() =>
      actualUseBatchCountProgress("user-1", "2026-02-28")
    );

    act(() => {
      result.current.saveProgress(data);
    });
    unmount();

    const { result: remountedResult } = renderHook(() =>
      actualUseBatchCountProgress("user-1", "2026-02-28")
    );

    await waitFor(() => {
      expect(remountedResult.current.progress).toEqual(data);
    });
  });

  it("clears stale session data on mount", async () => {
    const removeItemSpy = jest.spyOn(Storage.prototype, "removeItem");
    const actualUseBatchCountProgress = getHook();
    const staleKey = "batchCount-user-1-2026-02-28";

    localStorage.setItem(
      staleKey,
      JSON.stringify({
        sessionDate: "2026-02-27",
        data: {
          categoriesComplete: ["Bar"],
          enteredQuantities: { "item-1": 10 },
        },
      })
    );
    removeItemSpy.mockClear();

    const { result } = renderHook(() =>
      actualUseBatchCountProgress("user-1", "2026-02-28")
    );

    await waitFor(() => {
      expect(result.current.progress).toBeNull();
    });
    expect(removeItemSpy).toHaveBeenCalledWith(staleKey);
  });

  it("clearProgress removes storage entry and resets progress", async () => {
    const removeItemSpy = jest.spyOn(Storage.prototype, "removeItem");
    const actualUseBatchCountProgress = getHook();
    const data = {
      categoriesComplete: ["Cucina"],
      enteredQuantities: { "item-1": 4 },
    };

    const { result } = renderHook(() =>
      actualUseBatchCountProgress("user-1", "2026-02-28")
    );

    act(() => {
      result.current.saveProgress(data);
    });
    act(() => {
      result.current.clearProgress();
    });

    await waitFor(() => {
      expect(result.current.progress).toBeNull();
    });
    expect(removeItemSpy).toHaveBeenCalledWith("batchCount-user-1-2026-02-28");
  });
});
