import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

import SelectCoffeeOrTeaModal from "../SelectCoffeeOrTeaModal";

describe("SelectCoffeeOrTeaModal", () => {
  const orders = [
    { product: "Americano", count: 1, price: 3 },
    { product: "Tea", count: 2, price: 2 },
  ];

  it("renders order buttons and selects an item", async () => {
    const onSelectOrder = vi.fn();
    render(
      <SelectCoffeeOrTeaModal
        coffeeOrTeaOrders={orders}
        milkName="Oat Milk"
        onSelectOrder={onSelectOrder}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Americano" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "2x Tea" })).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "2x Tea" }));
    expect(onSelectOrder).toHaveBeenCalledWith("Tea");
  });

  it("calls onCancel when cancel clicked", async () => {
    const onCancel = vi.fn();
    render(
      <SelectCoffeeOrTeaModal
        coffeeOrTeaOrders={orders}
        milkName="Oat Milk"
        onSelectOrder={vi.fn()}
        onCancel={onCancel}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});

