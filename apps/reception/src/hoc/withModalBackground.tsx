/* File: /src/hoc/withModalBackground.tsx */
import { ComponentType, ReactElement } from "react";
import { SimpleModal } from "@acme/ui/molecules";

/**
 * Higher-order component that wraps a component with a modal background overlay
 */
export function withModalBackground<P extends object>(
  Component: ComponentType<P>
): ComponentType<P> {
  return function ModalBackgroundWrapper(props: P): ReactElement {
    const { onCancel, onClose } = props as {
      onCancel?: () => void;
      onClose?: () => void;
    };
    const handleClose = onCancel ?? onClose ?? (() => {});

    return (
      <SimpleModal
        isOpen
        onClose={handleClose}
        maxWidth="max-w-2xl"
        showCloseButton={false}
        className="max-h-screen overflow-auto"
      >
        <Component {...props} />
      </SimpleModal>
    );
  };
}
