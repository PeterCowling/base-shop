import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import LateFeesEditor from "../LateFeesEditor";

expect.extend(toHaveNoViolations as any);

const parseLateFeeForm = jest.fn((_formData: FormData) => ({
  data: { enabled: true, intervalMinutes: 5 },
}));

const updateLateFee = jest.fn();

jest.mock("@cms/actions/shops.server", () => ({
  updateLateFee: (...args: any[]) => updateLateFee(...args),
}));
jest.mock("../../../../../../../services/shops/validation", () => ({
  parseLateFeeForm,
}));
jest.mock(
  "@acme/ui/components/atoms/shadcn",
  () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Checkbox: ({ onCheckedChange, ...props }: any) => (
      <input
        type="checkbox"
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
    ),
    Input: (props: any) => <input {...props} />,
  }),
  { virtual: true },
);

describe("LateFeesEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits updated values, surfaces validation errors, and passes accessibility checks", async () => {
    updateLateFee.mockImplementation(async (_shop: string, formData: FormData) => {
      parseLateFeeForm(formData);
      return { errors: { intervalMinutes: ["Invalid"] } };
    });

    const { container } = render(
      <LateFeesEditor shop="s1" initial={{ enabled: false, intervalMinutes: 1 }} />,
    );

    await userEvent.click(screen.getByRole("checkbox"));
    const interval = screen.getByRole("spinbutton");
    await userEvent.clear(interval);
    await userEvent.type(interval, "5");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(parseLateFeeForm).toHaveBeenCalledTimes(1);
    const fd = parseLateFeeForm.mock.calls[0][0] as FormData;
    expect(fd.get("enabled")).toBe("on");
    expect(fd.get("intervalMinutes")).toBe("5");

    expect(await screen.findByText("Invalid")).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("persists server updates on success", async () => {
    updateLateFee.mockImplementation(async (_shop: string, formData: FormData) => {
      parseLateFeeForm(formData);
      return {
        settings: {
          lateFeeService: { enabled: true, intervalMinutes: 12 },
        },
      };
    });

    render(
      <LateFeesEditor shop="s1" initial={{ enabled: false, intervalMinutes: 2 }} />,
    );

    await userEvent.click(screen.getByRole("checkbox"));
    const interval = screen.getByRole("spinbutton");
    await userEvent.clear(interval);
    await userEvent.type(interval, "9");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).toBeChecked();
      expect(screen.getByRole("spinbutton")).toHaveValue(12);
    });

    expect(parseLateFeeForm).toHaveBeenCalledTimes(1);
  });
});
