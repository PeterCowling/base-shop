import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import DepositsEditor from "../DepositsEditor";

expect.extend(toHaveNoViolations);

const parseDepositForm = jest.fn(() => ({
  data: { enabled: true, intervalMinutes: 5 },
}));

const updateDeposit = jest.fn();

jest.mock("@cms/actions/shops.server", () => ({
  updateDeposit: (...args: any[]) => updateDeposit(...args),
}));
jest.mock("../../../../../../../services/shops/validation", () => ({
  parseDepositForm,
}));
jest.mock(
  "@ui/components/atoms/shadcn",
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

describe("DepositsEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits updated values, surfaces validation errors, and passes accessibility checks", async () => {
    updateDeposit.mockImplementation(async (_shop: string, formData: FormData) => {
      parseDepositForm(formData);
      return { errors: { intervalMinutes: ["Invalid"] } };
    });

    const { container } = render(
      <DepositsEditor shop="s1" initial={{ enabled: false, intervalMinutes: 1 }} />,
    );

    await userEvent.click(screen.getByRole("checkbox"));
    const interval = screen.getByRole("spinbutton");
    await userEvent.clear(interval);
    await userEvent.type(interval, "5");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(parseDepositForm).toHaveBeenCalledTimes(1);
    const fd = parseDepositForm.mock.calls[0][0] as FormData;
    expect(fd.get("enabled")).toBe("on");
    expect(fd.get("intervalMinutes")).toBe("5");

    expect(await screen.findByText("Invalid")).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("persists server updates on success", async () => {
    updateDeposit.mockImplementation(async (_shop: string, formData: FormData) => {
      parseDepositForm(formData);
      return {
        settings: {
          depositService: { enabled: false, intervalMinutes: 30 },
        },
      };
    });

    render(
      <DepositsEditor shop="s1" initial={{ enabled: true, intervalMinutes: 10 }} />,
    );

    await userEvent.click(screen.getByRole("checkbox"));
    const interval = screen.getByRole("spinbutton");
    await userEvent.clear(interval);
    await userEvent.type(interval, "45");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByRole("checkbox")).not.toBeChecked();
      expect(screen.getByRole("spinbutton")).toHaveValue(30);
    });

    expect(parseDepositForm).toHaveBeenCalledTimes(1);
  });
});
