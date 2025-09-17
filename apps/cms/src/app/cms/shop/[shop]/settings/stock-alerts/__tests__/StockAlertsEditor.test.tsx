import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";

import StockAlertsEditor from "../StockAlertsEditor";

expect.extend(toHaveNoViolations);

const updateStockAlert = jest.fn();

jest.mock("@cms/actions/shops.server", () => ({
  updateStockAlert: (...args: any[]) => updateStockAlert(...args),
}));
jest.mock("@/components/atoms", () => ({
  Toast: ({ open, message, ...props }: any) =>
    open ? (
      <div role="status" {...props}>
        {message}
      </div>
    ) : null,
  Chip: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Input: (props: any) => <input {...props} />,
    Textarea: (props: any) => <textarea {...props} />,
  }),
  { virtual: true },
);

describe("StockAlertsEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("validates input before saving", async () => {
    render(
      <StockAlertsEditor
        shop="lux"
        initial={{ recipients: ["ops@example.com"], webhook: "", threshold: 5 }}
      />,
    );

    await userEvent.clear(screen.getByLabelText(/recipients/i));
    await userEvent.type(screen.getByLabelText(/recipients/i), "invalid");
    await userEvent.clear(screen.getByLabelText(/default threshold/i));
    await userEvent.type(screen.getByLabelText(/default threshold/i), "0");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updateStockAlert).not.toHaveBeenCalled();
    expect(
      await screen.findByText(
        "Enter valid recipient email addresses separated by commas.",
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText("Invalid email")).toBeInTheDocument();
    expect(screen.getByText("Must be at least 1")).toBeInTheDocument();
  });

  it("normalizes values, submits updates, and shows success state", async () => {
    updateStockAlert.mockResolvedValue({
      settings: {
        stockAlert: {
          recipients: ["team@lux.com", "lead@lux.com"],
          webhook: "https://lux-hooks",
          threshold: 4,
        },
      },
    });

    const { container } = render(
      <StockAlertsEditor
        shop="lux"
        initial={{ recipients: [], webhook: "", threshold: undefined }}
      />,
    );

    await userEvent.type(
      screen.getByLabelText(/recipients/i),
      "team@lux.com , lead@lux.com ,",
    );
    await userEvent.clear(screen.getByLabelText(/webhook/i));
    await userEvent.type(screen.getByLabelText(/webhook/i), " https://hooks.example ");
    await userEvent.type(screen.getByLabelText(/default threshold/i), "10");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    const fd = updateStockAlert.mock.calls[0][1] as FormData;
    expect(fd.getAll("recipients")).toEqual(["team@lux.com", "lead@lux.com"]);
    expect(fd.get("webhook")).toBe("https://hooks.example");
    expect(fd.get("threshold")).toBe("10");

    await waitFor(() => {
      expect(updateStockAlert).toHaveBeenCalledTimes(1);
      expect(screen.getByLabelText(/default threshold/i)).toHaveValue(4);
    });

    expect(
      await screen.findByText("Stock alert settings saved."),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/recipients/i)).toHaveValue(
      "team@lux.com, lead@lux.com",
    );
    expect(screen.getByLabelText(/webhook/i)).toHaveValue("https://lux-hooks");

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
