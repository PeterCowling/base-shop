import { useState } from "react";
import { buildToastProps } from "../buildProps";

export type ToastState = { open: boolean; message: string; retry?: () => void };

const DEFAULT_TOAST = { open: false, message: "" } as const;

/**
 * Single purpose: manage toast state and derived props.
 */
export function useToastState() {
  const [toast, setToast] = useState<ToastState>(DEFAULT_TOAST);

  const toastProps = buildToastProps({
    open: toast.open,
    message: toast.message,
    retry: toast.retry,
    onClose: () => setToast((current) => ({ ...current, open: false })),
  });

  return { toast, setToast, toastProps } as const;
}

