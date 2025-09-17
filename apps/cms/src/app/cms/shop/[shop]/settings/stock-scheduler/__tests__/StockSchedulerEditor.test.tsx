import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import type { ComponentProps } from "react";

import StockSchedulerEditor from "../StockSchedulerEditor";

expect.extend(toHaveNoViolations);

const updateStockScheduler = jest.fn();

jest.mock("@cms/actions/stockScheduler.server", () => ({
  updateStockScheduler: (...args: any[]) => updateStockScheduler(...args),
}));
jest.mock(
  "@/components/atoms",
  () => ({
    Chip: ({ children, ...props }: any) => (
      <span {...props} data-chip>
        {children}
      </span>
    ),
    Toast: ({ open, message }: any) =>
      open ? (
        <div role="status" aria-live="polite">
          {message}
        </div>
      ) : null,
  }),
  { virtual: true },
);
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Input: (props: any) => <input {...props} />,
  }),
  { virtual: true },
);

describe("StockSchedulerEditor", () => {
  const localeSpy = jest
    .spyOn(Date.prototype, "toLocaleString")
    .mockImplementation(function (this: Date) {
      return `formatted-${this.getTime()}`;
    });

  afterAll(() => {
    localeSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("validates interval updates, announces toasts, and renders scheduler history accessibly", async () => {
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
    await userEvent.clear(interval);
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updateStockScheduler).not.toHaveBeenCalled();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Interval must be at least 1 millisecond.",
    );

    await userEvent.type(interval, "5000");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updateStockScheduler).toHaveBeenCalledTimes(1);
    const fd = updateStockScheduler.mock.calls[0][1] as FormData;
    expect(fd.get("intervalMs")).toBe("5000");

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Stock scheduler updated.",
    );

    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("formatted-2000");
    expect(rows[1]).toHaveTextContent("7");
    expect(rows[2]).toHaveTextContent("formatted-1000");
    expect(rows[2]).toHaveTextContent("2");

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
