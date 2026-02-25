import type { FC, ReactNode } from "react";

import { Button } from "@acme/design-system/atoms";

export interface FormContainerProps {
  title: string;
  borderColor: string;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
}

const FormContainer: FC<FormContainerProps> = ({
  title,
  borderColor,
  onClose,
  children,
  className,
}) => {
  return (
    <div
      className={`relative mb-6 border ${borderColor} rounded p-4 pr-8 pt-8 ${
        className ?? ""
      }`.trim()}
    >
      {onClose && (
        <Button
          onClick={onClose}
          aria-label="Close"
          color="danger"
          tone="solid"
          size="sm"
          iconOnly
          shape="pill"
          className="absolute right-2 top-2"
        >
          <span aria-hidden="true">&times;</span>
        </Button>
      )}
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      {children}
    </div>
  );
};

export default FormContainer;
