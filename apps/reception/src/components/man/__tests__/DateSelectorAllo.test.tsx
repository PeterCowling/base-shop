import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";

const useAuthMock = vi.hoisted(() => vi.fn());
vi.mock("../../../context/AuthContext", () => ({
  useAuth: useAuthMock,
}));

import DateSelectorAllo from "../DateSelectorAllo";

describe("DateSelectorAllo", () => {
  const onDateChange = vi.fn();
  const onTestModeChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ user: { user_name: "Pete" } });
  });

  it("allows Pete to change date and toggle test mode", async () => {
    const today = new Date();
    const formattedToday = new Date(
      today.getTime() - today.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];

    render(
      <DateSelectorAllo
        selectedDate="2024-05-01"
        onDateChange={onDateChange}
        testMode={false}
        onTestModeChange={onTestModeChange}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: /today/i }));
    expect(onDateChange).toHaveBeenCalledWith(formattedToday);

    await userEvent.click(screen.getByRole("checkbox"));
    expect(onTestModeChange).toHaveBeenCalledWith(true);
  });

  it("hides test mode toggle for non-Pete", () => {
    useAuthMock.mockReturnValue({ user: { user_name: "Alice" } });
    render(
      <DateSelectorAllo
        selectedDate="2024-05-01"
        onDateChange={onDateChange}
        testMode={false}
        onTestModeChange={onTestModeChange}
      />
    );
    expect(screen.queryByText(/test mode/i)).toBeNull();
  });
});
