import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { formatDateForInput } from "../../../utils/dateUtils";
import DateSelector from "../../common/DateSelector";

// Mock loan-related hooks for determinism
jest.mock("../../../hooks/data/useLoans", () => ({
  __esModule: true,
  default: () => ({ loans: {}, loading: false, error: null }),
}));
jest.mock("../../../context/LoanDataContext", () => ({
  useLoanData: () => ({ loans: {}, loading: false, error: null }),
}));
jest.mock("../../../context/AuthContext", () => ({
  useAuth: () => ({ user: { user_name: "user", roles: ["owner"] } }),
}));

describe("DateSelector", () => {
  it("calls onDateChange for quick selections", async () => {
    const onDateChange = jest.fn();
    render(
      <DateSelector
        selectedDate=""
        onDateChange={onDateChange}
        username="user"
      />,
    );

    const base = new Date();
    const today = formatDateForInput(base);
    const yesterday = formatDateForInput(
      new Date(base.getTime() - 86400000)
    );

    await userEvent.click(screen.getByRole("button", { name: /today/i }));
    expect(onDateChange).toHaveBeenLastCalledWith(today);

    await userEvent.click(screen.getByRole("button", { name: /yesterday/i }));
    expect(onDateChange).toHaveBeenLastCalledWith(yesterday);
  });
});
