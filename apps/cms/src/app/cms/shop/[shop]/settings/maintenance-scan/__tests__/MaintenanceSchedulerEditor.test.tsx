import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import MaintenanceSchedulerEditor from "../MaintenanceSchedulerEditor";

expect.extend(toHaveNoViolations);

const updateMaintenanceSchedule = jest.fn();

jest.mock("@cms/actions/maintenance.server", () => ({
  updateMaintenanceSchedule: (...args: any[]) => updateMaintenanceSchedule(...args),
}));
jest.mock("@/components/atoms", () => ({
  Toast: ({ open, message, ...props }: any) =>
    open ? (
      <div role="status" {...props}>
        <span>{message}</span>
      </div>
    ) : null,
}));
jest.mock("../../components/ErrorChips", () => ({
  ErrorChips: ({ errors }: { errors?: string[] }) => (
    <>
      {errors?.map((error, index) => (
        <span key={`${error}-${index}`}>{error}</span>
      ))}
    </>
  ),
}));
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Input: (props: any) => <input {...props} />,
  }),
  { virtual: true },
);

describe("MaintenanceSchedulerEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits the configured frequency and announces success", async () => {
    updateMaintenanceSchedule.mockResolvedValue(undefined);

    const { container } = render(<MaintenanceSchedulerEditor />);

    const input = screen.getByRole("spinbutton");
    await userEvent.type(input, "4500");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(updateMaintenanceSchedule).toHaveBeenCalledTimes(1);
    });
    const toastMessage = await screen.findByText(
      "Maintenance scan schedule updated.",
    );
    expect(toastMessage.closest("div")).toHaveAttribute("role", "status");

    const fd = updateMaintenanceSchedule.mock.calls[0][0] as FormData;
    expect(Number(fd.get("frequency"))).toBe(4500);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("shows validation feedback for invalid values", async () => {
    render(<MaintenanceSchedulerEditor />);

    const input = screen.getByRole("spinbutton");
    await userEvent.type(input, "0");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updateMaintenanceSchedule).not.toHaveBeenCalled();
    const chip = await screen.findByText("Enter a frequency greater than zero.");
    expect(chip).toBeInTheDocument();

    const toastMessage = await screen.findByText(
      "Frequency must be at least 1 millisecond.",
    );
    expect(toastMessage.closest("div")).toHaveAttribute("role", "status");
  });
});
