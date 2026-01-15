// File: /src/components/common/AlertModal.tsx
import { memo } from "react";
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/solid";
import { Cluster } from "@acme/ui/components/atoms/primitives";
import { SimpleModal } from "@acme/ui/molecules";

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
    bg: "bg-blue-100 dark:bg-blue-900/30",
    icon: "text-blue-600 dark:text-blue-400",
    button: "bg-blue-600 hover:bg-blue-700",
  },
  success: {
    bg: "bg-green-100 dark:bg-green-900/30",
    icon: "text-green-600 dark:text-green-400",
    button: "bg-green-600 hover:bg-green-700",
  },
  warning: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    icon: "text-amber-600 dark:text-amber-400",
    button: "bg-amber-600 hover:bg-amber-700",
  },
  error: {
    bg: "bg-red-100 dark:bg-red-900/30",
    icon: "text-red-600 dark:text-red-400",
    button: "bg-red-600 hover:bg-red-700",
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
      footer={
        <Cluster justify="center" className="w-full">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className={`min-h-11 min-w-11 rounded-md px-4 py-2 text-sm font-medium text-white ${colors.button}`}
          >
            {buttonLabel}
          </button>
        </Cluster>
      }
    >
      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${colors.bg}`}>
        <Icon className={`h-6 w-6 ${colors.icon}`} />
      </div>
      <p
        id="alert-message"
        className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400"
      >
        {message}
      </p>
    </SimpleModal>
  );
}

export default memo(AlertModal);
