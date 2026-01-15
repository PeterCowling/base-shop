/* src/utils/toastUtils.ts */
import { toast } from "react-toastify";

export type ToastMessageType = "success" | "error" | "info" | "warning";

/**
 * Default Toastify options shared across all toast calls.
 * Adjust these to match your preferred styling and behavior.
 */
const DEFAULT_TOAST_OPTIONS = {
  position: "top-center" as const,
  autoClose: 1500,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

/**
 * Shows a toast message with a predefined style.
 * @param message - The text you want to display.
 * @param type - One of "success", "error", "info", or "warning".
 */
export const showToast = (message: string, type: ToastMessageType): void => {
  switch (type) {
    case "success":
      toast.success(message, DEFAULT_TOAST_OPTIONS);
      break;
    case "error":
      toast.error(message, DEFAULT_TOAST_OPTIONS);
      break;
    case "info":
      toast.info(message, DEFAULT_TOAST_OPTIONS);
      break;
    case "warning":
      toast.warning(message, DEFAULT_TOAST_OPTIONS);
      break;
    default:
      toast(message, DEFAULT_TOAST_OPTIONS);
  }
};
