import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DepositsEditor from "../DepositsEditor";

const parseDepositForm = jest.fn(() => ({ data: { enabled: true, intervalMinutes: 5 } }));

jest.mock("@cms/actions/shops.server", () => ({
  updateDeposit: async (_shop: string, formData: FormData) => {
    parseDepositForm(formData);
    return { errors: { intervalMinutes: ["Invalid"] } };
  },
}));
jest.mock("../../../../../../../services/shops/validation", () => ({ parseDepositForm }));
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

jest.mock(
  "@/components/atoms",
  () => ({
    Chip: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    Switch: ({ onChange, ...props }: any) => (
      <input type="checkbox" onChange={onChange} {...props} />
    ),
    Toast: ({ open, message }: any) => (open ? <div>{message}</div> : null),
  }),
  { virtual: true },
);

describe("DepositsEditor", () => {
  it("submits updated values and shows validation errors", async () => {
    render(<DepositsEditor shop="s1" initial={{ enabled: false, intervalMinutes: 1 }} />);

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
  });
});
