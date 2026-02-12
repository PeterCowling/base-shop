/* src/utils/toastUtils.ts */
import { toast } from "@acme/ui/components/organisms/operations/NotificationCenter/NotificationCenter";

export type ToastMessageType = "success" | "error" | "info" | "warning";

/**
 * Default toast options to match previous react-toastify behavior.
 */
const DEFAULT_DURATION = 1500;

/**
 * Shows a toast message with a predefined style.
 * @param message - The text you want to display.
 * @param type - One of "success", "error", "info", or "warning".
 */
export const showToast = (message: string, type: ToastMessageType): void => {
  const options = { duration: DEFAULT_DURATION };

  switch (type) {
    case "success":
      toast.success(message, options);
      break;
    case "error":
      toast.error(message, options);
      break;
    case "info":
      toast.info(message, options);
      break;
    case "warning":
      toast.warning(message, options);
      break;
    default:
      toast.info(message, options);
  }
};
