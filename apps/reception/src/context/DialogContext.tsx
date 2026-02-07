// File: /src/context/DialogContext.tsx
"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import AlertModal, { type AlertType } from "../components/common/AlertModal";
import ConfirmModal, { type ConfirmVariant } from "../components/common/ConfirmModal";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

interface AlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  buttonLabel?: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  variant?: ConfirmVariant;
  confirmLabel?: string;
  cancelLabel?: string;
}

interface DialogContextValue {
  /** Show an alert modal (replaces window.alert) */
  showAlert: (options: AlertOptions) => Promise<void>;
  /** Show a confirmation modal (replaces window.confirm) */
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

/* -------------------------------------------------------------------------- */
/* Context                                                                     */
/* -------------------------------------------------------------------------- */

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

/* -------------------------------------------------------------------------- */
/* Provider                                                                    */
/* -------------------------------------------------------------------------- */

interface DialogProviderProps {
  children: React.ReactNode;
}

interface AlertState extends AlertOptions {
  resolve: () => void;
}

interface ConfirmState extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const showAlert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setAlertState({ ...options, resolve });
    });
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const handleAlertClose = useCallback(() => {
    alertState?.resolve();
    setAlertState(null);
  }, [alertState]);

  const handleConfirmConfirm = useCallback(() => {
    confirmState?.resolve(true);
    setConfirmState(null);
  }, [confirmState]);

  const handleConfirmCancel = useCallback(() => {
    confirmState?.resolve(false);
    setConfirmState(null);
  }, [confirmState]);

  const value = useMemo<DialogContextValue>(
    () => ({
      showAlert,
      showConfirm,
    }),
    [showAlert, showConfirm]
  );

  return (
    <DialogContext.Provider value={value}>
      {children}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertState !== null}
        title={alertState?.title ?? ""}
        message={alertState?.message ?? ""}
        type={alertState?.type}
        buttonLabel={alertState?.buttonLabel}
        onClose={handleAlertClose}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState !== null}
        title={confirmState?.title ?? ""}
        message={confirmState?.message ?? ""}
        variant={confirmState?.variant}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        onConfirm={handleConfirmConfirm}
        onCancel={handleConfirmCancel}
      />
    </DialogContext.Provider>
  );
};

/* -------------------------------------------------------------------------- */
/* Hook                                                                        */
/* -------------------------------------------------------------------------- */

export function useDialog(): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used inside a DialogProvider");
  }
  return context;
}

export default DialogContext;
