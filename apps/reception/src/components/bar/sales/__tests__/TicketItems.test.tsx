// TC-07: Bug 7 — TicketItems uses stable index key, not crypto.randomUUID
import "@testing-library/jest-dom";

import { render } from "@testing-library/react";

import type { SalesOrder } from "../../../../types/bar/BarTypes";
import TicketItems from "../TicketItems";

const makeOrder = (items: SalesOrder["items"]): SalesOrder => ({
  orderKey: "test-key",
  confirmed: false,
  bleepNumber: "go",
  userName: "tester",
  time: "12:00",
  paymentMethod: "cash",
  items,
});

describe("TicketItems", () => {
  it("TC-07: renders items without id without calling crypto.randomUUID", () => {
    const randomUUIDSpy = jest
      .spyOn(globalThis.crypto, "randomUUID")
      .mockReturnValue(
        "should-not-be-called" as ReturnType<typeof crypto.randomUUID>
      );

    const order = makeOrder([
      { product: "Beer", price: 5, count: 1 }, // no id
      { product: "Wine", price: 6, count: 2 }, // no id
    ]);

    render(<TicketItems order={order} removeSingleItem={jest.fn()} />);

    expect(randomUUIDSpy).not.toHaveBeenCalled();
    randomUUIDSpy.mockRestore();
  });

  it("renders product names correctly", () => {
    const { getByText } = render(
      <TicketItems
        order={makeOrder([
          { product: "Espresso", price: 3, count: 1 },
          { product: "Tea", price: 2, count: 3 },
        ])}
        removeSingleItem={jest.fn()}
      />
    );
    expect(getByText("Espresso")).toBeInTheDocument();
    expect(getByText("3 × Tea")).toBeInTheDocument();
  });
});
