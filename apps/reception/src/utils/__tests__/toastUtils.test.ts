import "@testing-library/jest-dom";
import { toast } from "react-toastify";

import { showToast, ToastMessageType } from "../toastUtils";

jest.mock("react-toastify", () => {
  const toastFn = jest.fn();
  return {
    toast: Object.assign(toastFn, {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warning: jest.fn(),
    }),
  };
});

const message = "msg";

describe("showToast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("routes success messages to toast.success", () => {
    showToast(message, "success");
    expect(toast.success).toHaveBeenCalledWith(message, expect.any(Object));
  });

  it("routes error messages to toast.error", () => {
    showToast(message, "error");
    expect(toast.error).toHaveBeenCalledWith(message, expect.any(Object));
  });

  it("routes info messages to toast.info", () => {
    showToast(message, "info");
    expect(toast.info).toHaveBeenCalledWith(message, expect.any(Object));
  });

  it("routes warning messages to toast.warning", () => {
    showToast(message, "warning");
    expect(toast.warning).toHaveBeenCalledWith(message, expect.any(Object));
  });

  it("calls toast for unknown types", () => {
    // Cast to unknown first to bypass strict type checking
    showToast(message, "other" as unknown as ToastMessageType);
    expect(toast).toHaveBeenCalledWith(message, expect.any(Object));
  });
});
