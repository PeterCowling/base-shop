import "@testing-library/jest-dom";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import BankDepositForm from "../BankDepositForm";

const toastMock = jest.fn();

jest.mock("../../../utils/toastUtils", () => ({
  showToast: (...args: [string, string]) => toastMock(...args),
}));

jest.mock("../../common/PasswordReauthInline", () => ({
  PasswordReauthInline: ({
    onSubmit,
    submitLabel,
  }: {
    onSubmit: () => void | Promise<void>;
    submitLabel?: string;
  }) => (
    <button type="button" onClick={() => void onSubmit()}>
      {submitLabel ?? "Confirm"}
    </button>
  ),
}));

describe("BankDepositForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("submits amount with keycard data", async () => {
    const onConfirm = jest.fn();
    render(
      <BankDepositForm
        currentKeycards={1}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    await userEvent.type(screen.getByLabelText(/Amount/i), "25");
    await userEvent.type(screen.getByLabelText(/Keycards Deposited/i), "1");
    await userEvent.click(screen.getByRole("button", { name: /Deposit/i }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(25, 2, 1));
  });

  it("doesn't submit zero amount", async () => {
    const onConfirm = jest.fn();
    render(
      <BankDepositForm
        currentKeycards={0}
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    );

    await userEvent.type(screen.getByLabelText(/Amount/i), "0");
    await userEvent.click(screen.getByRole("button", { name: /Deposit/i }));

    await waitFor(() => expect(onConfirm).not.toHaveBeenCalled());
    expect(toastMock).toHaveBeenCalled();
  });

  it("applies token-based theme styles", () => {
    render(
      <BankDepositForm
        currentKeycards={0}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(
      screen.getByText(/Record cash taken from the safe to deposit at the bank/i)
    ).toHaveClass("text-muted-foreground");
  });
});
