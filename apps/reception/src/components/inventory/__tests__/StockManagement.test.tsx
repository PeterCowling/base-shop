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
  return { default: useInventoryItemsMock };
});

jest.mock("../../../hooks/data/inventory/useInventoryLedger", () => {
  useInventoryLedgerMock = jest.fn();
  return { default: useInventoryLedgerMock };
});

jest.mock("../../../hooks/mutations/useInventoryItemsMutations", () => {
  useInventoryItemsMutationsMock = jest.fn();
  return { useInventoryItemsMutations: useInventoryItemsMutationsMock };
});

jest.mock("../../../hooks/mutations/useInventoryLedgerMutations", () => {
  useInventoryLedgerMutationsMock = jest.fn();
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
    createInventoryItem: jest.fn(),
    saveInventoryItem: jest.fn(),
  });
  useInventoryLedgerMutationsMock.mockReturnValue({
    addLedgerEntry: jest.fn(),
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

    const createObjectUrlSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:ledger");
    const revokeSpy = jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
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
    const revokeSpy = jest.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
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