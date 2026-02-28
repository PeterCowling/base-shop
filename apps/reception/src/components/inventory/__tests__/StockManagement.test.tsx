import "@testing-library/jest-dom";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { showToast } from "../../../utils/toastUtils";
import StockManagement from "../StockManagement";

/* eslint-disable no-var */
var useInventoryItemsMock: jest.Mock;
var useInventoryLedgerMock: jest.Mock;
var useInventoryItemsMutationsMock: jest.Mock;
var useInventoryLedgerMutationsMock: jest.Mock;
var useProductsMock: jest.Mock;
var useInventoryRecipesMock: jest.Mock;
var useInventoryRecipesMutationsMock: jest.Mock;
/* eslint-enable no-var */

jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { user_name: "Pete", roles: ["owner"], email: "pete@test.com" },
  }),
}));

jest.mock("../../../utils/toastUtils", () => ({ showToast: jest.fn() }));

jest.mock("../../common/PasswordReauthModal", () => ({
  __esModule: true,
  default: ({
    onSuccess,
  }: {
    onSuccess: () => void;
    onCancel: () => void;
  }) => <button onClick={onSuccess}>Confirm</button>,
}));

jest.mock("../../../hooks/data/inventory/useInventoryItems", () => {
  useInventoryItemsMock = jest.fn();
  return { __esModule: true, default: useInventoryItemsMock };
});

jest.mock("../../../hooks/data/inventory/useInventoryLedger", () => {
  useInventoryLedgerMock = jest.fn();
  return { __esModule: true, default: useInventoryLedgerMock };
});

jest.mock("../../../hooks/data/bar/useProducts", () => {
  useProductsMock = jest.fn();
  return { __esModule: true, useProducts: useProductsMock, default: useProductsMock };
});

jest.mock("../../../hooks/data/inventory/useInventoryRecipes", () => {
  useInventoryRecipesMock = jest.fn();
  return { __esModule: true, default: useInventoryRecipesMock };
});

jest.mock("../../../hooks/mutations/useInventoryItemsMutations", () => {
  useInventoryItemsMutationsMock = jest.fn();
  return { useInventoryItemsMutations: useInventoryItemsMutationsMock };
});

jest.mock("../../../hooks/mutations/useInventoryLedgerMutations", () => {
  useInventoryLedgerMutationsMock = jest.fn();
  return { useInventoryLedgerMutations: useInventoryLedgerMutationsMock };
});

jest.mock("../../../hooks/mutations/useInventoryRecipesMutations", () => {
  useInventoryRecipesMutationsMock = jest.fn();
  return { useInventoryRecipesMutations: useInventoryRecipesMutationsMock };
});

const baseItem = {
  id: "item-1",
  name: "Beans",
  unit: "kg",
  openingCount: 10,
  reorderThreshold: 5,
};

const baseItemsReturn = {
  items: [baseItem],
  itemsById: { "item-1": baseItem },
  loading: false,
  error: null,
};

const baseLedgerReturn = {
  entries: [],
  loading: false,
  error: null,
};

beforeEach(() => {
  useInventoryItemsMock.mockReturnValue(baseItemsReturn);
  useInventoryLedgerMock.mockReturnValue(baseLedgerReturn);
  useProductsMock.mockReturnValue({ allProducts: [] });
  useInventoryRecipesMock.mockReturnValue({ recipes: {}, loading: false, error: null });
  useInventoryItemsMutationsMock.mockReturnValue({
    createInventoryItem: jest.fn(),
    saveInventoryItem: jest.fn(),
  });
  useInventoryLedgerMutationsMock.mockReturnValue({
    addLedgerEntry: jest.fn(),
  });
  useInventoryRecipesMutationsMock.mockReturnValue({
    saveRecipe: jest.fn(),
    removeRecipe: jest.fn(),
  });
});

describe("StockManagement", () => {
  it("renders on-hand quantities from ledger", () => {
    useInventoryLedgerMock.mockReturnValue({
      ...baseLedgerReturn,
      entries: [
        {
          id: "entry-1",
          itemId: "item-1",
          type: "sale",
          quantity: -2,
          user: "Pete",
          timestamp: "2025-01-01T10:00:00.000+00:00",
        },
      ],
    });

    render(<StockManagement />);
    const row = screen.getByText("Beans").closest("tr");
    expect(row).not.toBeNull();
    expect(row).toHaveTextContent("8");
  });

  it("creates a new inventory item", async () => {
    const createItem = jest.fn();
    useInventoryItemsMutationsMock.mockReturnValue({
      createInventoryItem: createItem,
      saveInventoryItem: jest.fn(),
    });

    render(<StockManagement />);

    await userEvent.type(screen.getByPlaceholderText("Name"), "Milk");
    await userEvent.type(screen.getByPlaceholderText("Unit (e.g. kg)"), "ltr");
    await userEvent.type(
      screen.getByPlaceholderText("Opening Count"),
      "5"
    );
    await userEvent.type(
      screen.getByPlaceholderText("Reorder Threshold"),
      "2"
    );
    await userEvent.type(screen.getByPlaceholderText("Category"), "ingredient");
    await userEvent.click(screen.getByRole("button", { name: /add item/i }));

    expect(createItem).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Milk",
        unit: "ltr",
        openingCount: 5,
        reorderThreshold: 2,
        category: "ingredient",
        active: true,
      })
    );
  });

  it("records a receive entry without reauth", async () => {
    const addLedgerEntry = jest.fn();
    useInventoryLedgerMutationsMock.mockReturnValue({ addLedgerEntry });

    render(<StockManagement />);
    const row = screen.getByText("Beans").closest("tr") as HTMLElement;
    const quantityInput = within(row).getByPlaceholderText("Quantity");
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, "4");
    await userEvent.click(within(row).getByRole("button", { name: /record/i }));

    expect(addLedgerEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "item-1",
        type: "receive",
        quantity: 4,
      })
    );
  });

  it("records count variance as a delta", async () => {
    const addLedgerEntry = jest.fn();
    useInventoryLedgerMutationsMock.mockReturnValue({ addLedgerEntry });
    useInventoryLedgerMock.mockReturnValue({
      ...baseLedgerReturn,
      entries: [
        {
          id: "entry-1",
          itemId: "item-1",
          type: "sale",
          quantity: -2,
          user: "Pete",
          timestamp: "2025-01-01T10:00:00.000+00:00",
        },
      ],
    });

    render(<StockManagement />);
    const row = screen.getByText("Beans").closest("tr") as HTMLElement;
    await userEvent.selectOptions(within(row).getByRole("combobox"), "count");
    await userEvent.type(
      within(row).getByPlaceholderText("Quantity"),
      "10"
    );
    await userEvent.type(
      within(row).getByPlaceholderText("Reason"),
      "cycle count"
    );
    await userEvent.click(within(row).getByRole("button", { name: /record/i }));

    expect(addLedgerEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "item-1",
        type: "count",
        quantity: 2,
        reason: "cycle count",
      })
    );
  });

  it("requires reauth for large adjustments", async () => {
    const addLedgerEntry = jest.fn();
    useInventoryLedgerMutationsMock.mockReturnValue({ addLedgerEntry });

    render(<StockManagement />);
    const row = screen.getByText("Beans").closest("tr") as HTMLElement;
    await userEvent.selectOptions(within(row).getByRole("combobox"), "adjust");
    await userEvent.type(
      within(row).getByPlaceholderText("Quantity"),
      "10"
    );
    await userEvent.type(
      within(row).getByPlaceholderText("Reason"),
      "audit"
    );
    await userEvent.click(within(row).getByRole("button", { name: /record/i }));

    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    expect(addLedgerEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        itemId: "item-1",
        type: "adjust",
        quantity: 10,
        reason: "audit",
      })
    );
  });

  it("shows low stock alert when below threshold", () => {
    useInventoryItemsMock.mockReturnValue({
      ...baseItemsReturn,
      items: [
        {
          ...baseItem,
          reorderThreshold: 8,
        },
      ],
      itemsById: {
        "item-1": {
          ...baseItem,
          reorderThreshold: 8,
        },
      },
    });
    useInventoryLedgerMock.mockReturnValue({
      ...baseLedgerReturn,
      entries: [
        {
          id: "entry-1",
          itemId: "item-1",
          type: "sale",
          quantity: -4,
          user: "Pete",
          timestamp: "2025-01-01T10:00:00.000+00:00",
        },
      ],
    });

    render(<StockManagement />);
    expect(
      screen.getByText(/beans: 6 on hand \(threshold 8\)/i)
    ).toBeInTheDocument();
  });

  it("shows shrinkage alert when unexplained count discrepancy exceeds threshold", () => {
    const recent = new Date().toISOString();
    useInventoryLedgerMock.mockReturnValue({
      ...baseLedgerReturn,
      entries: [
        {
          id: "entry-1",
          itemId: "item-1",
          type: "count",
          quantity: -12,
          user: "Pete",
          timestamp: recent,
        },
      ],
    });

    render(<StockManagement />);
    expect(
      screen.getByText(/beans: 12 unexplained units in 24h/i)
    ).toBeInTheDocument();
  });

  it("does not alert when count discrepancy is fully covered by documented waste", () => {
    const recent = new Date().toISOString();
    useInventoryLedgerMock.mockReturnValue({
      ...baseLedgerReturn,
      entries: [
        {
          id: "entry-1",
          itemId: "item-1",
          type: "waste",
          quantity: -12,
          user: "Pete",
          timestamp: recent,
        },
        {
          id: "entry-2",
          itemId: "item-1",
          type: "count",
          quantity: -12,
          user: "Pete",
          timestamp: recent,
        },
      ],
    });

    render(<StockManagement />);
    expect(
      screen.getByText(/no abnormal shrinkage detected/i)
    ).toBeInTheDocument();
  });

  it("exports ledger CSV", async () => {
    const addLedgerEntry = jest.fn();
    useInventoryLedgerMutationsMock.mockReturnValue({ addLedgerEntry });
    useInventoryLedgerMock.mockReturnValue({
      ...baseLedgerReturn,
      entries: [
        {
          id: "entry-1",
          itemId: "item-1",
          type: "receive",
          quantity: 4,
          user: "Pete",
          timestamp: "2025-01-01T10:00:00.000+00:00",
        },
      ],
    });

    const createObjectUrlSpy = jest
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:ledger");
    const revokeSpy = jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    render(<StockManagement />);
    await userEvent.click(
      screen.getByRole("button", { name: /export ledger csv/i })
    );

    expect(createObjectUrlSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith("Exported 1 ledger record", "success");

    createObjectUrlSpy.mockRestore();
    revokeSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it("exports variance CSV", async () => {
    useInventoryLedgerMock.mockReturnValue({
      ...baseLedgerReturn,
      entries: [
        {
          id: "entry-1",
          itemId: "item-1",
          type: "count",
          quantity: -2,
          user: "Pete",
          timestamp: "2025-01-01T10:00:00.000+00:00",
        },
      ],
    });

    const createObjectUrlSpy = jest
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:variance");
    const revokeSpy = jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const clickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    render(<StockManagement />);
    await userEvent.click(
      screen.getByRole("button", { name: /export variance csv/i })
    );

    expect(createObjectUrlSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith(
      "Exported 1 variance record",
      "success"
    );

    createObjectUrlSpy.mockRestore();
    revokeSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it("TC-R08: Count Variance Report renders reason column value for count entry with reason", () => {
    useInventoryLedgerMock.mockReturnValue({
      ...baseLedgerReturn,
      entries: [
        {
          id: "entry-1",
          itemId: "item-1",
          type: "count",
          quantity: -2,
          reason: "Furto",
          user: "Pete",
          timestamp: new Date().toISOString(),
        },
      ],
    });

    render(<StockManagement />);

    const reportSection = screen.getByText("Count Variance Report").closest("section");
    expect(reportSection).not.toBeNull();
    expect(within(reportSection as HTMLElement).getByText("Furto")).toBeInTheDocument();
  });

  describe("Variance Breakdown", () => {
    const makeEntry = (type: string, qty: number, daysAgo = 0, reason?: string) => ({
      id: `vb-${type}-${daysAgo}-${Math.random().toString(36).slice(2)}`,
      itemId: "item-1",
      type,
      quantity: qty,
      user: "Pete",
      timestamp: new Date(
        Date.now() - daysAgo * 24 * 60 * 60 * 1000
      ).toISOString(),
      ...(reason !== undefined ? { reason } : {}),
    });

    const getVarianceSection = () =>
      screen.getByText("Variance Breakdown").closest("section")!;

    it("TC-01: shows unexplained gap when waste partially covers count discrepancy", () => {
      useInventoryLedgerMock.mockReturnValue({
        ...baseLedgerReturn,
        entries: [makeEntry("waste", -5), makeEntry("count", -8)],
      });

      render(<StockManagement />);

      expect(screen.getByText("Variance Breakdown")).toBeInTheDocument();
      const section = getVarianceSection();
      const row = within(section).getByText("Beans").closest("tr")!;
      expect(within(row).getByText("5")).toBeInTheDocument(); // Explained
      expect(within(row).getByText("8")).toBeInTheDocument(); // Count Discrepancy
      expect(within(row).getByText("3")).toBeInTheDocument(); // Unexplained
    });

    it("TC-02: shows zero unexplained when waste fully covers count discrepancy", () => {
      useInventoryLedgerMock.mockReturnValue({
        ...baseLedgerReturn,
        entries: [makeEntry("waste", -10), makeEntry("count", -8)],
      });

      render(<StockManagement />);

      const section = getVarianceSection();
      const row = within(section).getByText("Beans").closest("tr")!;
      expect(within(row).getByText("10")).toBeInTheDocument(); // Explained
      expect(within(row).getByText("8")).toBeInTheDocument(); // Count Discrepancy
      expect(within(row).getByText("0")).toBeInTheDocument(); // Unexplained
    });

    it("TC-03: excludes items with no count entries from variance breakdown", () => {
      useInventoryLedgerMock.mockReturnValue({
        ...baseLedgerReturn,
        entries: [makeEntry("waste", -5)],
      });

      render(<StockManagement />);

      const section = getVarianceSection();
      expect(within(section).queryByText("Beans")).toBeNull();
      expect(
        within(section).getByText(/no stock variance to explain/i)
      ).toBeInTheDocument();
    });

    it("TC-04: excludes items with net-positive count delta from variance breakdown", () => {
      useInventoryLedgerMock.mockReturnValue({
        ...baseLedgerReturn,
        entries: [makeEntry("count", 3)],
      });

      render(<StockManagement />);

      const section = getVarianceSection();
      expect(within(section).queryByText("Beans")).toBeNull();
      expect(
        within(section).getByText(/no stock variance to explain/i)
      ).toBeInTheDocument();
    });

    it("TC-05: uses net count delta across multiple count entries", () => {
      useInventoryLedgerMock.mockReturnValue({
        ...baseLedgerReturn,
        entries: [makeEntry("count", 2), makeEntry("count", -5)],
      });

      render(<StockManagement />);

      const section = getVarianceSection();
      const row = within(section).getByText("Beans").closest("tr")!;
      expect(within(row).getByText("0")).toBeInTheDocument(); // Explained=0
      // Discrepancy=3 and Unexplained=3 both appear
      expect(within(row).getAllByText("3")).toHaveLength(2);
    });

    it("TC-06: window selector recomputes breakdown on change", async () => {
      useInventoryLedgerMock.mockReturnValue({
        ...baseLedgerReturn,
        entries: [makeEntry("waste", -3, 9), makeEntry("count", -5, 9)],
      });

      render(<StockManagement />);

      // 7-day window (default): 9-day-old entries are outside → empty state
      const section = getVarianceSection();
      expect(within(section).queryByText("Beans")).toBeNull();

      // Change to 14-day window
      await userEvent.selectOptions(
        within(section).getByTestId("variance-window-select"),
        "14"
      );

      // Now 9-day-old entries are inside 14-day window → row appears
      const sectionAfter = getVarianceSection();
      const row = within(sectionAfter).getByText("Beans").closest("tr")!;
      expect(within(row).getByText("3")).toBeInTheDocument(); // Explained
      expect(within(row).getByText("5")).toBeInTheDocument(); // Count Discrepancy
      expect(within(row).getByText("2")).toBeInTheDocument(); // Unexplained
    });

    it("TC-07: shows empty state when no items have net-negative count delta", () => {
      useInventoryLedgerMock.mockReturnValue({
        ...baseLedgerReturn,
        entries: [makeEntry("count", 1)],
      });

      render(<StockManagement />);

      const section = getVarianceSection();
      expect(
        within(section).getByText(/no stock variance to explain/i)
      ).toBeInTheDocument();
      expect(within(section).queryByRole("table")).toBeNull();
    });

    it("TC-VR01: reason breakdown shows \"Scarto\" total for count entry with reason \"Scarto\"", () => {
      useInventoryLedgerMock.mockReturnValue({
        ...baseLedgerReturn,
        entries: [makeEntry("count", -5, 0, "Scarto")],
      });

      render(<StockManagement />);

      const section = getVarianceSection();
      const reasonTable = within(section).getByTestId("reason-breakdown-table");
      expect(reasonTable).toBeInTheDocument();
      const row = within(reasonTable).getByText("Scarto").closest("tr")!;
      expect(within(row).getByText("5")).toBeInTheDocument();
    });

    it("TC-VR02: ungrouped reason shows \"Non specificato\" for entry with no reason", () => {
      useInventoryLedgerMock.mockReturnValue({
        ...baseLedgerReturn,
        entries: [makeEntry("count", -3, 0)],
      });

      render(<StockManagement />);

      const section = getVarianceSection();
      const reasonTable = within(section).getByTestId("reason-breakdown-table");
      const row = within(reasonTable).getByText("Non specificato").closest("tr")!;
      expect(within(row).getByText("3")).toBeInTheDocument();
    });

    it("TC-VR03: legacy \"conteggio batch\" reason groups under \"Non specificato\"", () => {
      useInventoryLedgerMock.mockReturnValue({
        ...baseLedgerReturn,
        entries: [makeEntry("count", -2, 0, "conteggio batch")],
      });

      render(<StockManagement />);

      const section = getVarianceSection();
      const reasonTable = within(section).getByTestId("reason-breakdown-table");
      const row = within(reasonTable).getByText("Non specificato").closest("tr")!;
      expect(within(row).getByText("2")).toBeInTheDocument();
      expect(within(reasonTable).queryByText("conteggio batch")).toBeNull();
    });

    it("TC-VR04: positive count entry not included in reason breakdown", () => {
      useInventoryLedgerMock.mockReturnValue({
        ...baseLedgerReturn,
        entries: [makeEntry("count", 3, 0, "Scarto")],
      });

      render(<StockManagement />);

      const section = getVarianceSection();
      expect(within(section).queryByTestId("reason-breakdown-table")).toBeNull();
    });

    it("TC-VR05: reason breakdown absent when all count entries outside window", () => {
      useInventoryLedgerMock.mockReturnValue({
        ...baseLedgerReturn,
        entries: [makeEntry("count", -5, 15, "Furto")],
      });

      render(<StockManagement />);

      const section = getVarianceSection();
      expect(within(section).queryByTestId("reason-breakdown-table")).toBeNull();
    });
  });
});
