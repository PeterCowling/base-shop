import "@testing-library/jest-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import DepositsEditor from "../DepositsEditor";

expect.extend(toHaveNoViolations);

const parseDepositForm = jest.fn(() => ({
  data: { enabled: true, intervalMinutes: 5 },
}));

const updateDeposit = jest.fn();

const CLIENT_VALIDATION_MESSAGE = "Enter an interval of at least one minute.";
const SERVER_ERROR_MESSAGE = "Unable to update deposit service.";
const SUCCESS_MESSAGE = "Deposit service updated.";

jest.mock("@cms/actions/shops.server", () => ({
  updateDeposit: (...args: any[]) => updateDeposit(...args),
}));
jest.mock("../../../../../../../services/shops/validation", () => ({
  parseDepositForm,
}));
jest.mock("@/components/atoms", () => ({
  Toast: ({ open, message, className, onClose, ...props }: any) =>
    open ? (
      <div role="status" className={className} {...props}>
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
  Chip: ({ children, ...props }: any) => (
    <span {...props}>{children}</span>
  ),
}));
jest.mock(
  "@acme/ui/components/atoms/shadcn",
  () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
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

  it("prevents submission when the interval is invalid", async () => {
    render(
      <DepositsEditor shop="s1" initial={{ enabled: true, intervalMinutes: 1 }} />,
    );

    const interval = screen.getByRole("spinbutton");
    await userEvent.clear(interval);
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updateDeposit).not.toHaveBeenCalled();

    const field = interval.closest("div");
    expect(field).not.toBeNull();
    expect(
      await within(field as HTMLElement).findByText(CLIENT_VALIDATION_MESSAGE),
    ).toBeInTheDocument();

    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent(CLIENT_VALIDATION_MESSAGE);
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

    await waitFor(() => {
      expect(updateDeposit).toHaveBeenCalledTimes(1);
      expect(parseDepositForm).toHaveBeenCalledTimes(1);
    });

    const [, formData] = updateDeposit.mock.calls[0] as [string, FormData];
    expect(formData.get("enabled")).toBe("on");
    expect(formData.get("intervalMinutes")).toBe("5");

    expect(await screen.findByText("Invalid")).toBeInTheDocument();

    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent(SERVER_ERROR_MESSAGE);

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

    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent(SUCCESS_MESSAGE);
  });
});
