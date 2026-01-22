import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CreditSlipRegistry } from "../CreditSlipRegistry";

const addCreditSlipMock = jest.fn();
jest.mock("../../../hooks/data/till/useCreditSlipsMutations", () => ({
  useCreditSlipsMutations: () => ({ addCreditSlip: addCreditSlipMock }),
}));

describe("CreditSlipRegistry", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("adds a credit slip when form valid", async () => {
    render(<CreditSlipRegistry />);
    await userEvent.type(screen.getByPlaceholderText("Slip #"), "A1");
    await userEvent.type(screen.getByPlaceholderText("Amount"), "12.5");
    expect(
      screen.queryByPlaceholderText("Comment (optional)")
    ).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("Add Slip"));

    expect(addCreditSlipMock).toHaveBeenCalledWith({
      slipNumber: "A1",
      amount: 12.5,
    });
    expect(screen.getByPlaceholderText("Slip #")).toHaveValue("");
    expect(screen.getByPlaceholderText("Amount")).toHaveValue("");
  });

  it("does nothing when data invalid", async () => {
    render(<CreditSlipRegistry />);
    await userEvent.type(screen.getByPlaceholderText("Amount"), "bad");
    await userEvent.click(screen.getByText("Add Slip"));
    expect(addCreditSlipMock).not.toHaveBeenCalled();
  });
});
