import { toast } from "react-toastify";
import { beforeEach, describe, expect, it } from "vitest";

import { showToast, ToastMessageType } from "../toastUtils";

vi.mock("react-toastify", () => {
  const toastFn = vi.fn();
  return {
    toast: Object.assign(toastFn, {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    }),
  };
});

const message = "msg";

describe("showToast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
