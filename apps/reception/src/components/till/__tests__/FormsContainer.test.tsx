import "@testing-library/jest-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type {
  CloseShiftFormProps,
  OpenShiftFormProps,
  Transaction,
} from "../../../types/component/Till";
import FormsContainer from "../FormsContainer";

jest.mock("../OpenShiftForm", () => ({
  OpenShiftForm: ({
    onConfirm,
    onCancel,
  }: Pick<OpenShiftFormProps, "onConfirm" | "onCancel">) => (
    <div>
      <button onClick={() => onConfirm(100, true, 5, { a: 1 })}>
        confirm-open
      </button>
      <button onClick={onCancel}>cancel-open</button>
    </div>
  ),
}));

jest.mock("../CloseShiftForm", () => ({
  CloseShiftForm: ({
    onConfirm,
    onCancel,
  }: Pick<CloseShiftFormProps, "onConfirm" | "onCancel">) => (
    <div>
      <button onClick={() => onConfirm(200, 2, true, { b: 1 })}>
        confirm-close
      </button>
      <button onClick={onCancel}>cancel-close</button>
    </div>
  ),
}));

describe("FormsContainer", () => {
  const baseProps = {
    shiftOpenTime: null as Date | null,
    showOpenShiftForm: false,
    showCloseShiftForm: false,
    closeShiftFormVariant: "close" as const,
    showKeycardCountForm: false,
    showFloatForm: false,
    showExchangeForm: false,
    showTenderRemovalForm: false,
    lastCloseCashCount: 0,
    expectedCashAtClose: 0,
    expectedKeycardsAtClose: 0,
    ccTransactionsFromLastShift: [] as Transaction[],
    ccTransactionsFromThisShift: [] as Transaction[],
    confirmShiftOpen: jest.fn(),
    confirmShiftClose: jest.fn(),
    confirmKeycardReconcile: jest.fn(),
    confirmFloat: jest.fn(),
    confirmExchange: jest.fn(),
    handleTenderRemoval: jest.fn(),
    setShowOpenShiftForm: jest.fn(),
    setShowCloseShiftForm: jest.fn(),
    setShowKeycardCountForm: jest.fn(),
    setShowFloatForm: jest.fn(),
    setShowExchangeForm: jest.fn(),
    setShowTenderRemovalForm: jest.fn(),
    pinRequiredForTenderRemoval: false,
  };

  it("renders open shift form and handles confirm/cancel", async () => {
    const props = { ...baseProps, showOpenShiftForm: true };
    render(<FormsContainer {...props} />);
    await userEvent.click(screen.getByText("confirm-open"));
    expect(props.confirmShiftOpen).toHaveBeenCalledWith(100, true, 5, { a: 1 });
    await userEvent.click(screen.getByText("cancel-open"));
    expect(props.setShowOpenShiftForm).toHaveBeenCalledWith(false);
  });

  it("renders close shift form and handles confirm/cancel", async () => {
    const props = { ...baseProps, shiftOpenTime: new Date(), showCloseShiftForm: true };
    render(<FormsContainer {...props} />);
    await userEvent.click(screen.getByText("confirm-close"));
    expect(props.confirmShiftClose).toHaveBeenCalledWith(
      "close",
      200,
      2,
      true,
      { b: 1 },
      undefined,
      undefined
    );
    await userEvent.click(screen.getByText("cancel-close"));
    expect(props.setShowCloseShiftForm).toHaveBeenCalledWith(false);
  });
});
