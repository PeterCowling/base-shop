// File: /src/components/common/AlertModal.tsx
import { memo } from "react";
import {
  CheckCircle2,
  CircleAlert,
  Info,
  TriangleAlert,
} from "lucide-react";

import type { ButtonProps } from "@acme/design-system/atoms";
import { Button } from "@acme/design-system/atoms";
import { Cluster } from "@acme/design-system/primitives";
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
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: CircleAlert,
};

const colorMap: Record<AlertType, { bg: string; icon: string; buttonColor: ButtonProps["color"] }> = {
  info: { bg: "bg-info-light", icon: "text-info-main", buttonColor: "info" },
  success: { bg: "bg-success-light", icon: "text-success-main", buttonColor: "success" },
  warning: { bg: "bg-warning-light", icon: "text-warning-main", buttonColor: "warning" },
  error: { bg: "bg-error-light", icon: "text-error-main", buttonColor: "danger" },
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
            color={colors.buttonColor}
            tone="solid"
            className="min-h-11 min-w-11"
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
        className="mt-2 text-center text-sm text-muted-foreground"
      >
        {message}
      </p>
    </SimpleModal>
  );
}

export default memo(AlertModal);
