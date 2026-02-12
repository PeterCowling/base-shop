import "@testing-library/jest-dom";

import { toast } from "@acme/ui/components/organisms/operations/NotificationCenter/NotificationCenter";

import { showToast, type ToastMessageType } from "../toastUtils";

jest.mock("@acme/ui/components/organisms/operations/NotificationCenter/NotificationCenter", () => {
  return {
    toast: {
      success: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      warning: jest.fn(),
    },
  };
});

const message = "msg";

describe("showToast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("routes success messages to toast.success", () => {
    showToast(message, "success");
    expect(toast.success).toHaveBeenCalledWith(message, expect.objectContaining({ duration: 1500 }));
  });

  it("routes error messages to toast.error", () => {
    showToast(message, "error");
    expect(toast.error).toHaveBeenCalledWith(message, expect.objectContaining({ duration: 1500 }));
  });

  it("routes info messages to toast.info", () => {
    showToast(message, "info");
    expect(toast.info).toHaveBeenCalledWith(message, expect.objectContaining({ duration: 1500 }));
  });

  it("routes warning messages to toast.warning", () => {
    showToast(message, "warning");
    expect(toast.warning).toHaveBeenCalledWith(message, expect.objectContaining({ duration: 1500 }));
  });

  it("calls toast.info for unknown types", () => {
    // Cast to unknown first to bypass strict type checking
    showToast(message, "other" as unknown as ToastMessageType);
    expect(toast.info).toHaveBeenCalledWith(message, expect.objectContaining({ duration: 1500 }));
  });
});
