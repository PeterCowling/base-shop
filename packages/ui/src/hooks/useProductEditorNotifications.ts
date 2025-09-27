"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// i18n-exempt — defaults are overrideable; wrap for linting
/* i18n-exempt */
const t = (s: string) => s;

interface NotificationMessages {
  saving: string;
  success: string;
  error: string;
}

export interface UseProductEditorNotificationsOptions {
  saving: boolean;
  hasErrors: boolean;
  autoCloseMs?: number;
  messages?: Partial<NotificationMessages>;
}

export interface ProductEditorToastState {
  open: boolean;
  message: string;
}

const DEFAULT_MESSAGES: NotificationMessages = {
  saving: t("Saving product…"),
  success: t("Product saved successfully."),
  error: t("We couldn't save your changes. Check the highlighted sections."),
};

/**
 * Controls toast messaging for the product editor so the form can stay lean.
 */
export function useProductEditorNotifications({
  saving,
  hasErrors,
  autoCloseMs = 4000,
  messages: messageOverrides,
}: UseProductEditorNotificationsOptions) {
  const messages = useMemo(
    () => ({ ...DEFAULT_MESSAGES, ...messageOverrides }),
    [messageOverrides],
  );

  const [toast, setToast] = useState<ProductEditorToastState>({
    open: false,
    message: "",
  });
  const prevSavingRef = useRef(false);

  useEffect(() => {
    if (saving && !prevSavingRef.current) {
      setToast({ open: true, message: messages.saving });
    } else if (!saving && prevSavingRef.current) {
      setToast({
        open: true,
        message: hasErrors ? messages.error : messages.success,
      });
    }
    prevSavingRef.current = saving;
  }, [saving, hasErrors, messages]);

  useEffect(() => {
    if (!toast.open) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, autoCloseMs);

    return () => window.clearTimeout(timer);
  }, [toast.open, autoCloseMs]);

  const closeToast = useCallback(() => {
    setToast((prev) => ({ ...prev, open: false }));
  }, []);

  return { toast, closeToast } as const;
}

export default useProductEditorNotifications;
