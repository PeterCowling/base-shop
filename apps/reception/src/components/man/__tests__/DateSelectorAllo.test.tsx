import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DateSelector from "../../common/DateSelector";

const authMock = jest.fn();
jest.mock("../../../context/AuthContext", () => ({
  useAuth: (...args: unknown[]) => authMock(...args),
}));

describe("DateSelector", () => {
  const onDateChange = jest.fn();
  const onTestModeChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    authMock.mockReturnValue({ user: { user_name: "Pete", roles: ["owner"] } });
  });

  it("allows privileged users to change date and toggle test mode", async () => {
    const today = new Date();
    const formattedToday = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];

    render(
      <DateSelector
        selectedDate="2024-05-01"
        onDateChange={onDateChange}
        testMode={false}
        onTestModeChange={onTestModeChange}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /today/i }));
    expect(onDateChange).toHaveBeenCalledWith(formattedToday);

    await userEvent.click(screen.getByRole("checkbox"));
    expect(onTestModeChange).toHaveBeenCalledWith(true);
  });

  it("hides test mode toggle for non-privileged users", () => {
    authMock.mockReturnValue({ user: { user_name: "Alice", roles: ["staff"] } });
    render(
      <DateSelector
        selectedDate="2024-05-01"
        onDateChange={onDateChange}
        testMode={false}
        onTestModeChange={onTestModeChange}
      />,
    );
    expect(screen.queryByText(/test mode/i)).toBeNull();
  });
});
