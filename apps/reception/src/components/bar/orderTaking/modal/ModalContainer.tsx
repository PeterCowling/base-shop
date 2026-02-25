/* File: src/components/bar/modal/ModalContainer.tsx */
import React, { type FC, memo } from "react";

/**
 * Simple container for modal content.
 * The "withModalBackground" HOC uses this as a child to standardize styling.
 */
export interface ModalContainerProps {
  children: React.ReactNode;
  widthClasses?: string; // e.g. "w-80"
}

const ModalContainer: FC<ModalContainerProps> = memo(
  ({ children, widthClasses }) => {
    return (
      <div
        className={`bg-surface p-6 rounded shadow-lg ${widthClasses || "w-80"}`}
      >
        {children}
      </div>
    );
  }
);

ModalContainer.displayName = "ModalContainer";
export default ModalContainer;
