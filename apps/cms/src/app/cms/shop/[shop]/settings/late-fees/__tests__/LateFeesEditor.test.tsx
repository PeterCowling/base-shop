import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LateFeesEditor from "../LateFeesEditor";

const parseLateFeeForm = jest.fn(() => ({ data: { enabled: true, intervalMinutes: 5 } }));

jest.mock("@cms/actions/shops.server", () => ({
  updateLateFee: async (_shop: string, formData: FormData) => {
    parseLateFeeForm(formData);
    return { errors: { intervalMinutes: ["Invalid"] } };
  },
}));
jest.mock("../../../../../../../services/shops/validation", () => ({ parseLateFeeForm }));
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

describe("LateFeesEditor", () => {
  it("submits updated values and shows validation errors", async () => {
    render(<LateFeesEditor shop="s1" initial={{ enabled: false, intervalMinutes: 1 }} />);

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
  });
});
