import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { showToast } from "../../../utils/toastUtils";

import StockManagement from "../StockManagement";

/* eslint-disable no-var */
var useInventoryItemsMock: ReturnType<typeof vi.fn>;
var useInventoryLedgerMock: ReturnType<typeof vi.fn>;
var useInventoryItemsMutationsMock: ReturnType<typeof vi.fn>;
var useInventoryLedgerMutationsMock: ReturnType<typeof vi.fn>;
/* eslint-enable no-var */

vi.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { user_name: "Pete", roles: ["owner"], email: "pete@test.com" },
  }),
}));

vi.mock("../../../utils/toastUtils", () => ({ showToast: vi.fn() }));

vi.mock("../../common/PasswordReauthModal", () => ({
  __esModule: true,
  default: ({
    onSuccess,
  }: {
    onSuccess: () => void;
    onCancel: () => void;
  }) => <button onClick={onSuccess}>Confirm</button>,
}));

vi.mock("../../../hooks/data/inventory/useInventoryItems", () => {
  useInventoryItemsMock = vi.fn();
  return { default: useInventoryItemsMock };
});

vi.mock("../../../hooks/data/inventory/useInventoryLedger", () => {
  useInventoryLedgerMock = vi.fn();
  return { default: useInventoryLedgerMock };
});

vi.mock("../../../hooks/mutations/useInventoryItemsMutations", () => {
  useInventoryItemsMutationsMock = vi.fn();
  return { useInventoryItemsMutations: useInventoryItemsMutationsMock };
});

vi.mock("../../../hooks/mutations/useInventoryLedgerMutations", () => {
  useInventoryLedgerMutationsMock = vi.fn();
  return { useInventoryLedgerMutations: useInventoryLedgerMutationsMock };
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
  useInventoryItemsMutationsMock.mockReturnValue({
    createInventoryItem: vi.fn(),
    saveInventoryItem: vi.fn(),
  });
  useInventoryLedgerMutationsMock.mockReturnValue({
    addLedgerEntry: vi.fn(),
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
    const createItem = vi.fn();
    useInventoryItemsMutationsMock.mockReturnValue({
      createInventoryItem: createItem,
      saveInventoryItem: vi.fn(),
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
    const addLedgerEntry = vi.fn();
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
    const addLedgerEntry = vi.fn();
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
    const addLedgerEntry = vi.fn();
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

  it("shows shrinkage alert when removals exceed threshold", () => {
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
      ],
    });

    render(<StockManagement />);
    expect(
      screen.getByText(/beans: 12 units removed in 24h/i)
    ).toBeInTheDocument();
  });

  it("exports ledger CSV", async () => {
    const addLedgerEntry = vi.fn();
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

    const createObjectUrlSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:ledger");
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const clickSpy = vi
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

    const createObjectUrlSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:variance");
    const revokeSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const clickSpy = vi
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
});