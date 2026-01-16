import "@testing-library/jest-dom/vitest";
import { act } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach, vi } from "vitest";
import type { AggregatedOrder } from "../../../../types/bar/BarTypes";
import OrderList from "../OrderList";
import type { PayModalProps } from "../modal/PayModal";

let capturedPayModalProps: PayModalProps | null = null;

vi.mock("../modal/PayModal", () => ({
  __esModule: true,
  default: (props: PayModalProps) => {
    capturedPayModalProps = props;
    return <div data-testid="pay-modal" />;
  },
}));

const sampleOrders: AggregatedOrder[] = [
  { product: "Beer", price: 2.5, count: 1 },
  { product: "Wine", price: 4, count: 2 },
];

const onRemoveItem = vi.fn();
const onClearAll = vi.fn();
const onConfirmPayment = vi.fn();

function renderList() {
  render(
    <OrderList
      orders={sampleOrders}
      onRemoveItem={onRemoveItem}
      onClearAll={onClearAll}
      onConfirmPayment={onConfirmPayment}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  capturedPayModalProps = null;
});

describe("OrderList", () => {
  it("renders counts and totals", () => {
    renderList();
    const rows = screen.getAllByRole("row").slice(1); // skip header
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Beer");
    expect(rows[0]).toHaveTextContent("2.50");
    expect(rows[1]).toHaveTextContent("2× Wine");
    expect(rows[1]).toHaveTextContent("8.00");
  });

  it("removes item when row clicked", async () => {
    renderList();
    const user = userEvent.setup();
    const rows = screen.getAllByRole("row").slice(1);
    await user.click(rows[1]);
    expect(onRemoveItem).toHaveBeenCalledWith("Wine");
  });

  it("opens PayModal and forwards onConfirm", async () => {
    renderList();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /pay/i }));
    expect(screen.getByTestId("pay-modal")).toBeInTheDocument();
    act(() => {
      capturedPayModalProps?.onConfirm("card", "go");
    });
    expect(onConfirmPayment).toHaveBeenCalledWith("card", "go");
    expect(screen.queryByTestId("pay-modal")).not.toBeInTheDocument();
  });

  it("clears all items", async () => {
    renderList();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Clear\xa0All" }));
    expect(onClearAll).toHaveBeenCalled();
  });
});
