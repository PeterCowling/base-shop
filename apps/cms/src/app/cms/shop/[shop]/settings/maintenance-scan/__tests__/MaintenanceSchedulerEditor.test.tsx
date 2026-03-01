import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import {
  __getUseSettingsSaveFormToastLog,
  __resetUseSettingsSaveFormMock,
} from "../../hooks/useSettingsSaveForm";
import MaintenanceSchedulerEditor from "../MaintenanceSchedulerEditor";

jest.mock("../../hooks/useSettingsSaveForm");

expect.extend(toHaveNoViolations as any);

const updateMaintenanceSchedule = jest.fn();

jest.mock("@cms/actions/maintenance.server", () => ({
  updateMaintenanceSchedule: (...args: any[]) => updateMaintenanceSchedule(...args),
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
    __resetUseSettingsSaveFormMock();
    jest.clearAllMocks();
  });

  it("submits the configured frequency and surfaces success feedback", async () => {
    updateMaintenanceSchedule.mockResolvedValue(undefined);

    const { container } = render(<MaintenanceSchedulerEditor />);

    const input = screen.getByRole("spinbutton");
    await userEvent.type(input, "4500");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(__getUseSettingsSaveFormToastLog().at(-1)).toEqual({
      status: "success",
      message: "Maintenance scan schedule updated.",
    });
    expect(updateMaintenanceSchedule).toHaveBeenCalledTimes(1);
    const fd = updateMaintenanceSchedule.mock.calls[0][0] as FormData;
    expect(fd.get("frequency")).toBe("4500");
    expect(Number(fd.get("frequency"))).toBe(4500);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("validates a positive frequency before submission", async () => {
    const { container } = render(<MaintenanceSchedulerEditor />);

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updateMaintenanceSchedule).not.toHaveBeenCalled();
    expect(
      await screen.findByText("Enter a frequency greater than zero."),
    ).toBeInTheDocument();
    expect(__getUseSettingsSaveFormToastLog().at(-1)).toEqual({
      status: "error",
      message: "Frequency must be at least 1 millisecond.",
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
