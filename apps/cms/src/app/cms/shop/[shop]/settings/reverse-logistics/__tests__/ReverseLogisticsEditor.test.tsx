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
  Toast: ({ open, message, className, role = "status", ...props }: any) =>
    open ? (
      <div role={role} className={className} {...props}>
        <span>{message}</span>
      </div>
    ) : null,
  Switch: ({ id, name, checked, onChange, disabled, ...props }: any) => (
    <input
      id={id}
      name={name}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      {...props}
    />
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
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Checkbox: ({ onCheckedChange, onClick, ...props }: any) => (
      <input
        type="checkbox"
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        onClick={onClick}
        {...props}
      />
    ),
    Input: (props: any) => <input {...props} />,
  }),
  { virtual: true },
);

describe("ReverseLogisticsEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("prevents submission when the interval is invalid", async () => {
    updateReverseLogistics.mockResolvedValue({});

    render(
      <ReverseLogisticsEditor
        shop="shop-1"
        initial={{ enabled: false, intervalMinutes: 10 }}
      />,
    );

    const user = userEvent.setup();
    const interval = screen.getByRole("spinbutton");
    await user.clear(interval);
    await user.type(interval, "0");
    await user.click(screen.getByRole("button", { name: /save/i }));

    const chip = await screen.findByText((content, element) => {
      return (
        content === "Interval must be greater than zero." &&
        element?.classList.contains("bg-destructive/10")
      );
    });

    expect(chip).toHaveClass("text-destructive");
    const toastMessage = (
      await screen.findAllByText(/Interval must be greater than zero\./)
    ).find((element) => element.closest('[role="status"]'));
    expect(toastMessage).toBeDefined();
    const toast = toastMessage!.closest('[role="status"]');
    expect(toast).toHaveClass("bg-destructive");
    expect(updateReverseLogistics).not.toHaveBeenCalled();
  });

  it("submits updated values, populates FormData, and shows a success toast", async () => {
    updateReverseLogistics.mockResolvedValue({});

    const { container } = render(
      <ReverseLogisticsEditor
        shop="shop-1"
        initial={{ enabled: false, intervalMinutes: 10 }}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Reverse logistics"));
    const interval = screen.getByRole("spinbutton");
    await user.clear(interval);
    await user.type(interval, "15");
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(updateReverseLogistics).toHaveBeenCalledTimes(1));
    const fd = updateReverseLogistics.mock.calls[0][1] as FormData;
    expect(fd.get("enabled")).toBe("on");
    expect(fd.get("intervalMinutes")).toBe("15");

    const successMessage = await screen.findByText(/Reverse logistics updated\./);
    const toast = successMessage.closest('[role="status"]');
    expect(toast).toHaveClass("bg-success");
    expect(toast).toHaveClass("text-success-fg");

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("applies server updates on success", async () => {
    updateReverseLogistics.mockResolvedValue({
      settings: { reverseLogisticsService: { enabled: false, intervalMinutes: 45 } },
    });

    render(
      <ReverseLogisticsEditor
        shop="shop-1"
        initial={{ enabled: true, intervalMinutes: 5 }}
      />,
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByLabelText("Reverse logistics")).not.toBeChecked();
      expect(screen.getByRole("spinbutton")).toHaveValue(45);
    });
  });
});
