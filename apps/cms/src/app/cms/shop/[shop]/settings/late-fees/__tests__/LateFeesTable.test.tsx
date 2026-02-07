import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";

import { mapLateFeeRows } from "../../tableMappers";
import LateFeesTable from "../LateFeesTable";

const readOrders = jest.fn();
const DataTable = jest.fn((_props: unknown) => null);

jest.mock("@acme/platform-core/repositories/rentalOrders.server", () => ({
  readOrders: (...args: unknown[]) => readOrders(...args),
}));

jest.mock("@acme/cms-ui/DataTable", () => ({
  __esModule: true,
  default: (props: unknown) => DataTable(props),
}));

describe("LateFeesTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders a message when no late fees are charged", async () => {
    readOrders.mockResolvedValueOnce([]);

    render(await LateFeesTable({ shop: "s1" }));

    expect(screen.getByText("No late fees charged.")).toBeInTheDocument();
    expect(DataTable).not.toHaveBeenCalled();
  });

  it("passes mapped late-fee rows to the DataTable", async () => {
    const orders = [
      { sessionId: "order-1", lateFeeCharged: 12 },
      { sessionId: "order-2", lateFeeCharged: null },
      { sessionId: "order-3", lateFeeCharged: 0 },
      { sessionId: "order-4", lateFeeCharged: 4.5 },
    ];
    readOrders.mockResolvedValueOnce(orders);

    render(await LateFeesTable({ shop: "s2" }));

    expect(DataTable).toHaveBeenCalledTimes(1);
    const tableProps = DataTable.mock.calls[0][0] as { rows: ReturnType<typeof mapLateFeeRows> };
    const expectedRows = mapLateFeeRows([orders[0], orders[3]]);

    expect(tableProps.rows).toEqual(expectedRows);
    expect(tableProps.rows.map((row) => row.orderId)).toEqual([
      "order-1",
      "order-4",
    ]);
  });
});
