import "@testing-library/jest-dom";

import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import StockSchedulerEditor from "../StockSchedulerEditor";

expect.extend(toHaveNoViolations as any);

const updateStockScheduler = jest.fn();

jest.mock("@cms/actions/stockScheduler.server", () => ({
  updateStockScheduler: (...args: any[]) => updateStockScheduler(...args),
}));
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Card: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Input: (props: any) => <input {...props} />,
  }),
  { virtual: true },
);
jest.mock("@/components/atoms", () => ({
  __esModule: true,
  Chip: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  Toast: ({ open, message, role = "status" }: any) =>
    open ? <div role={role}>{message}</div> : null,
}));

describe("StockSchedulerEditor", () => {
  beforeEach(() => {
    updateStockScheduler.mockClear();
  });

  const localeSpy = jest
    .spyOn(Date.prototype, "toLocaleString")
    .mockImplementation(function (this: Date) {
      return `formatted-${this.getTime()}`;
    });

  afterAll(() => {
    localeSpy.mockRestore();
  });

  it("validates the interval, displays toasts, and renders scheduler history accessibly", async () => {
    updateStockScheduler.mockResolvedValue(undefined);

    const status: ComponentProps<typeof StockSchedulerEditor>["status"] = {
      intervalMs: 1000,
      lastRun: 2000,
      history: [
        { timestamp: 1000, alerts: 2 },
        { timestamp: 2000, alerts: 7 },
      ],
    };

    const { container } = render(
      <StockSchedulerEditor shop="lux" status={status} />,
    );

    const interval = screen.getByRole("spinbutton");
    const saveButton = screen.getByRole("button", { name: /save changes/i });

    await userEvent.clear(interval);
    await userEvent.click(saveButton);

    expect(updateStockScheduler).not.toHaveBeenCalled();

    expect(
      await screen.findByText("Interval must be at least 1 millisecond."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enter an interval greater than zero."),
    ).toBeInTheDocument();

    await userEvent.type(interval, "5000");
    await userEvent.click(saveButton);

    expect(
      await screen.findByText("Stock scheduler updated."),
    ).toBeInTheDocument();

    expect(updateStockScheduler).toHaveBeenCalledTimes(1);
    const [shopArg, formDataArg] = updateStockScheduler.mock.calls[0];
    expect(shopArg).toBe("lux");
    const fd = formDataArg as FormData;
    expect(fd.get("intervalMs")).toBe("5000");

    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("formatted-2000");
    expect(rows[1]).toHaveTextContent("7");
    expect(rows[2]).toHaveTextContent("formatted-1000");
    expect(rows[2]).toHaveTextContent("2");

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
