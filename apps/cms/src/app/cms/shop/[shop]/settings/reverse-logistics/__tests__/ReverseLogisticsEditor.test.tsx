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
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
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

  it("submits updated values and shows validation errors", async () => {
    updateReverseLogistics.mockResolvedValue({
      errors: { intervalMinutes: ["Too low"] },
    });

    const { container } = render(
      <ReverseLogisticsEditor
        shop="shop-1"
        initial={{ enabled: false, intervalMinutes: 10 }}
      />,
    );

    await userEvent.click(screen.getByRole("checkbox"));
    const interval = screen.getByRole("spinbutton");
    await userEvent.clear(interval);
    await userEvent.type(interval, "15");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updateReverseLogistics).toHaveBeenCalledTimes(1);
    const fd = updateReverseLogistics.mock.calls[0][1] as FormData;
    expect(fd.get("enabled")).toBe("on");
    expect(fd.get("intervalMinutes")).toBe("15");

    expect(await screen.findByText("Too low")).toBeInTheDocument();

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

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).not.toBeChecked();
      expect(screen.getByRole("spinbutton")).toHaveValue(45);
    });
  });
});
