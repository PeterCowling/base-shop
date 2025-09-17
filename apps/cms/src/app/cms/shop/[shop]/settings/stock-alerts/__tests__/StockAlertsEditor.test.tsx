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
jest.mock(
  "@/components/atoms/shadcn",
  () => ({
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Input: (props: any) => <input {...props} />,
  }),
  { virtual: true },
);

describe("StockAlertsEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits edited values and surfaces validation errors", async () => {
    updateStockAlert.mockResolvedValue({
      errors: { recipients: ["Invalid recipients"] },
    });

    const { container } = render(
      <StockAlertsEditor
        shop="lux"
        initial={{ recipients: ["ops@example.com"], webhook: "", threshold: 5 }}
      />,
    );

    await userEvent.clear(screen.getByLabelText(/recipients/i));
    await userEvent.type(screen.getByLabelText(/recipients/i), "alerts@lux.com");
    await userEvent.clear(screen.getByLabelText(/webhook/i));
    await userEvent.type(screen.getByLabelText(/webhook/i), "https://hooks.example");
    await userEvent.clear(screen.getByLabelText(/default threshold/i));
    await userEvent.type(screen.getByLabelText(/default threshold/i), "10");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updateStockAlert).toHaveBeenCalledTimes(1);
    const fd = updateStockAlert.mock.calls[0][1] as FormData;
    expect(fd.get("recipients")).toBe("alerts@lux.com");
    expect(fd.get("webhook")).toBe("https://hooks.example");
    expect(fd.get("threshold")).toBe("10");

    expect(await screen.findByText("Invalid recipients")).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("applies server updates on success", async () => {
    updateStockAlert.mockResolvedValue({
      settings: {
        stockAlert: {
          recipients: ["team@lux.com", "lead@lux.com"],
          webhook: "https://lux-hooks",
          threshold: 4,
        },
      },
    });

    render(
      <StockAlertsEditor
        shop="lux"
        initial={{ recipients: [], webhook: "", threshold: undefined }}
      />,
    );

    await userEvent.type(screen.getByLabelText(/recipients/i), "team@lux.com, lead@lux.com");
    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/recipients/i)).toHaveValue("team@lux.com, lead@lux.com");
      expect(screen.getByLabelText(/webhook/i)).toHaveValue("https://lux-hooks");
      expect(screen.getByLabelText(/default threshold/i)).toHaveValue(4);
    });
  });
});
