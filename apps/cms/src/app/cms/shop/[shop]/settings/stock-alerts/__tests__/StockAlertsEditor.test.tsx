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
  __esModule: true,
  Chip: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  Toast: ({ open, message, className, ...props }: any) =>
    open ? (
      <div role="status" className={className} {...props}>
        {message}
      </div>
    ) : null,
}));
jest.mock("@/components/atoms/shadcn", () => {
  const componentStub = require("../../../../../../../../../../test/__mocks__/componentStub.js");
  return {
    __esModule: true,
    Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    Button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    Input: (props: any) => <input {...props} />,
    Textarea: (props: any) => <textarea {...props} />,
    default: componentStub,
  };
});

describe("StockAlertsEditor", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("validates recipients and threshold before submitting", async () => {
    const { container } = render(
      <StockAlertsEditor
        shop="lux"
        initial={{ recipients: ["ops@example.com"], webhook: "", threshold: 5 }}
      />,
    );

    const recipientsField = screen.getByLabelText(/recipients/i);
    await userEvent.clear(recipientsField);
    await userEvent.type(recipientsField, "bad-email");

    const thresholdField = screen.getByLabelText(/default threshold/i);
    await userEvent.clear(thresholdField);
    await userEvent.type(thresholdField, "0");

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updateStockAlert).not.toHaveBeenCalled();

    expect(await screen.findByText("Invalid email: bad-email")).toBeInTheDocument();
    expect(screen.getByText("Enter a threshold of at least 1.")).toBeInTheDocument();

    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent("Enter valid recipient email addresses.");

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("submits sanitized values and surfaces success toast", async () => {
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

    const recipientsField = screen.getByLabelText(/recipients/i);
    await userEvent.type(recipientsField, " team@lux.com , ops@lux.com , ");

    const webhookField = screen.getByLabelText(/webhook url/i);
    await userEvent.type(webhookField, " https://hooks.example/path  ");

    const thresholdField = screen.getByLabelText(/default threshold/i);
    await userEvent.type(thresholdField, "10");

    await userEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(updateStockAlert).toHaveBeenCalledTimes(1);
    const formData = updateStockAlert.mock.calls[0][1] as FormData;
    const sanitizedRecipients = String(formData.get("recipients"))
      .split(",")
      .map((value) => value.trim());
    expect(sanitizedRecipients).toEqual(["team@lux.com", "ops@lux.com"]);
    expect(formData.get("webhook")).toBe("https://hooks.example/path");
    expect(formData.get("threshold")).toBe("10");

    const toast = await screen.findByRole("status");
    expect(toast).toHaveTextContent("Stock alert settings saved.");

    await waitFor(() => {
      expect(screen.getByLabelText(/recipients/i)).toHaveValue("team@lux.com, lead@lux.com");
      expect(screen.getByLabelText(/webhook/i)).toHaveValue("https://lux-hooks");
      expect(screen.getByLabelText(/default threshold/i)).toHaveValue(4);
    });
  });
});
