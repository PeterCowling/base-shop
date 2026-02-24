// File: /src/components/common/AlertModal.tsx
import { memo } from "react";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid";

import { Cluster } from "@acme/design-system/primitives";
import { SimpleModal } from "@acme/ui/molecules";
import { ReceptionButton as Button } from "@acme/ui/operations";

export type AlertType = "info" | "success" | "warning" | "error";

interface AlertModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: AlertType;
  onClose: () => void;
  buttonLabel?: string;
}

const iconMap = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  error: ExclamationCircleIcon,
};

const colorMap = {
  info: {
    bg: "bg-info-light dark:bg-blue-900/30",
    icon: "text-info-main dark:text-blue-400",
    button: "bg-info-main hover:bg-blue-700",
  },
  success: {
    bg: "bg-success-light dark:bg-green-900/30",
    icon: "text-success-main dark:text-success-main",
    button: "bg-success-main hover:bg-green-700",
  },
  warning: {
    bg: "bg-warning-light dark:bg-amber-900/30",
    icon: "text-warning-main dark:text-amber-400",
    button: "bg-warning-main hover:bg-amber-700",
  },
  error: {
    bg: "bg-error-light dark:bg-red-900/30",
    icon: "text-error-main dark:text-red-400",
    button: "bg-error-main hover:bg-red-700",
  },
};

/**
 * Modal for displaying alert messages (replaces window.alert).
 */
function AlertModal({
  isOpen,
  title,
  message,
  type = "info",
  onClose,
  buttonLabel = "OK",
}: AlertModalProps) {
  if (!isOpen) return null;

  const Icon = iconMap[type];
  const colors = colorMap[type];

  return (
    <SimpleModal
      isOpen
      onClose={onClose}
      title={title}
      maxWidth="max-w-sm"
      className=""
      backdropClassName=""
      footer={
        <Cluster justify="center" className="w-full">
          <Button
            type="button"
            onClick={onClose}
            autoFocus
            className={`min-h-11 min-w-11 rounded-md px-4 py-2 text-sm font-medium text-primary-fg ${colors.button}`}
          >
            {buttonLabel}
          </Button>
        </Cluster>
      }
    >
      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${colors.bg}`}>
        <Icon className={`h-6 w-6 ${colors.icon}`} />
      </div>
      <p
        id="alert-message"
        className="mt-2 text-center text-sm text-muted-foreground dark:text-muted-foreground"
      >
        {message}
      </p>
    </SimpleModal>
  );
}

export default memo(AlertModal);
