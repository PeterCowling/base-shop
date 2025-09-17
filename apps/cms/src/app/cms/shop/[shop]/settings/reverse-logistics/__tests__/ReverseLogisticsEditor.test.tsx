import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import ReverseLogisticsEditor from "../ReverseLogisticsEditor";

expect.extend(toHaveNoViolations);

const updateReverseLogistics = jest.fn();

jest.mock("@cms/actions/shops.server", () => ({
  updateReverseLogistics: (...args: any[]) => updateReverseLogistics(...args),
}));
jest.mock("@/components/atoms", () => ({
  Toast: ({ open, message, className, role, onClose }: any) =>
    open ? (
      <div className={className} role={role}>
        <span>{message}</span>
        {onClose ? (
          <button type="button" onClick={onClose}>
            Close
          </button>
        ) : null}
      </div>
    ) : null,
  Switch: ({ checked, onChange, ...props }: any) => (
    <label>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange?.(event)}
        {...props}
      />
    </label>
  ),
  Chip: ({ children, className, ...props }: any) => (
    <span className={className} {...props}>
      {children}
    </span>
  ),
}));
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Input: (props: any) => <input {...props} />,
  }),
  { virtual: true },
);

describe("ReverseLogisticsEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prevents submission when interval is not positive", async () => {
    const { container } = render(
      <ReverseLogisticsEditor
        shop="shop-1"
        initial={{ enabled: true, intervalMinutes: 10 }}
      />,
    );

    const interval = screen.getByRole("spinbutton");
    await userEvent.clear(interval);
    await userEvent.type(interval, "0");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updateReverseLogistics).not.toHaveBeenCalled();

    const chip = await screen.findByText(/Enter an interval greater than zero/i);
    expect(chip).toHaveClass("bg-destructive/10");
    expect(chip).toHaveClass("text-destructive");
    expect(chip).toHaveAttribute("data-token", "--color-danger");

    await waitFor(() => {
      expect(
        screen.getByText("Interval must be at least 1 minute."),
      ).toBeInTheDocument();
    });
    const destructiveToast = screen
      .getByText("Interval must be at least 1 minute.")
      .closest("div") as HTMLDivElement;
    expect(destructiveToast).toHaveClass("bg-destructive");
    expect(destructiveToast).toHaveClass("text-destructive-foreground");

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("submits updated values and surfaces server validation errors", async () => {
    updateReverseLogistics.mockResolvedValue({
      errors: { intervalMinutes: ["Too low"], enabled: ["Must be enabled"] },
    });

    render(
      <ReverseLogisticsEditor
        shop="shop-1"
        initial={{ enabled: false, intervalMinutes: 10 }}
      />,
    );

    await userEvent.click(screen.getByLabelText("Reverse logistics"));
    const interval = screen.getByRole("spinbutton");
    await userEvent.clear(interval);
    await userEvent.type(interval, "15");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updateReverseLogistics).toHaveBeenCalledTimes(1);
    expect(updateReverseLogistics).toHaveBeenCalledWith(
      "shop-1",
      expect.any(FormData),
    );
    const fd = updateReverseLogistics.mock.calls[0][1] as FormData;
    expect(fd.get("enabled")).toBe("on");
    expect(fd.get("intervalMinutes")).toBe("15");

    const intervalChip = await screen.findByText(/Too low/i);
    expect(intervalChip).toHaveAttribute("data-token", "--color-danger");
    const enabledChip = await screen.findByText(/Must be enabled/i);
    expect(enabledChip).toHaveAttribute("data-token", "--color-danger");
  });

  it("shows a success toast after a valid submission", async () => {
    updateReverseLogistics.mockResolvedValue({
      settings: { reverseLogisticsService: { enabled: false, intervalMinutes: 45 } },
    });

    render(
      <ReverseLogisticsEditor
        shop="shop-1"
        initial={{ enabled: true, intervalMinutes: 5 }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(updateReverseLogistics).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(
        screen.getByText("Reverse logistics updated."),
      ).toBeInTheDocument();
    });
    const toast = screen
      .getByText("Reverse logistics updated.")
      .closest("div") as HTMLDivElement;
    expect(toast).toHaveClass("bg-success");
    expect(toast).toHaveClass("text-success-fg");

    await waitFor(() => {
      expect(screen.getByLabelText("Reverse logistics")).not.toBeChecked();
      expect(screen.getByRole("spinbutton")).toHaveValue(45);
    });
  });
});
