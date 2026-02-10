import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import DOBSection from "../DOBSection";

const showToastMock = jest.fn();

jest.mock("../../../../context/AuthContext", () => ({
  useAuth: () => ({
    user: { user_name: "Pete" },
  }),
}));

jest.mock("../../../../utils/toastUtils", () => ({
  showToast: (...args: unknown[]) => showToastMock(...args),
}));

describe("DOBSection", () => {
  beforeEach(() => {
    showToastMock.mockReset();
  });

  it("applies override when allowed user confirms invalid DOB", async () => {
    const saveField = jest.fn(() => Promise.resolve());

    render(
      <DOBSection
        occupantDetails={{
          allocated: "1",
          dateOfBirth: { yyyy: "1990", mm: "01", dd: "01" },
        }}
        saveField={saveField}
      />
    );

    const monthInput = screen.getByPlaceholderText("MM");
    await userEvent.clear(monthInput);
    await userEvent.type(monthInput, "13");
    await userEvent.tab();

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Override" }));

    await waitFor(() => {
      expect(saveField).toHaveBeenCalledWith("dateOfBirth", {
        yyyy: "1990",
        mm: "13",
        dd: "01",
      });
    });
  });

  it("reverts DOB when override is cancelled", async () => {
    const saveField = jest.fn(() => Promise.resolve());

    render(
      <DOBSection
        occupantDetails={{
          allocated: "1",
          dateOfBirth: { yyyy: "1990", mm: "01", dd: "01" },
        }}
        saveField={saveField}
      />
    );

    const monthInput = screen.getByPlaceholderText("MM");
    await userEvent.clear(monthInput);
    await userEvent.type(monthInput, "13");
    await userEvent.tab();

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(saveField).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.getByPlaceholderText("MM")).toHaveValue("01");
    });
  });
});
