import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import FormsContainer from "../FormsContainer";
import type {
  Transaction,
  OpenShiftFormProps,
  CloseShiftFormProps,
} from "../../../types/component/Till";

vi.mock("../OpenShiftForm", () => ({
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

vi.mock("../CloseShiftForm", () => ({
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
    confirmShiftOpen: vi.fn(),
    confirmShiftClose: vi.fn(),
    confirmKeycardReconcile: vi.fn(),
    confirmFloat: vi.fn(),
    confirmExchange: vi.fn(),
    handleTenderRemoval: vi.fn(),
    setShowOpenShiftForm: vi.fn(),
    setShowCloseShiftForm: vi.fn(),
    setShowKeycardCountForm: vi.fn(),
    setShowFloatForm: vi.fn(),
    setShowExchangeForm: vi.fn(),
    setShowTenderRemovalForm: vi.fn(),
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
      { b: 1 }
    );
    await userEvent.click(screen.getByText("cancel-close"));
    expect(props.setShowCloseShiftForm).toHaveBeenCalledWith(false);
  });
});
