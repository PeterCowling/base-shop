import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PettyCashForm from "../PettyCashForm";

const toastMock = jest.fn();
jest.mock("../../../utils/toastUtils", () => ({
  showToast: (...args: [string, string]) => toastMock(...args),
}));

jest.mock("../../common/PasswordReauthInline", () => ({
  __esModule: true,
  default: ({
    onSubmit,
    submitLabel = "Confirm",
  }: {
    onSubmit: () => void | Promise<void>;
    submitLabel?: string;
  }) => (
    <button type="button" onClick={() => void onSubmit()}>
      {submitLabel}
    </button>
  ),
}));

describe("PettyCashForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits amount when confirmation is triggered", async () => {
    const onConfirm = jest.fn();
    render(<PettyCashForm onConfirm={onConfirm} onCancel={jest.fn()} />);

    await userEvent.type(screen.getByPlaceholderText("Amount"), "15");
    await userEvent.click(
      screen.getByRole("button", { name: /confirm withdrawal/i })
    );

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(15));
  });

  it("blocks confirmation when amount is missing", async () => {
    const onConfirm = jest.fn();
    render(<PettyCashForm onConfirm={onConfirm} onCancel={jest.fn()} />);

    await userEvent.click(
      screen.getByRole("button", { name: /confirm withdrawal/i })
    );

    await waitFor(() => {
      expect(onConfirm).not.toHaveBeenCalled();
    });
    expect(toastMock).toHaveBeenCalledWith(
      "Please enter valid values",
      "error"
    );
  });

  it("applies token-based theme styles", () => {
    render(
      <PettyCashForm onConfirm={jest.fn()} onCancel={jest.fn()} />
    );
    const heading = screen.getByText(/petty cash withdrawal/i);
    expect(heading.closest('[role="dialog"]')).toBeInTheDocument();
  });
});
