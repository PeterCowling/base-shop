/**
 * Test mock for SimpleModal (@acme/ui/molecules).
 *
 * Replaces the Radix Dialog-based SimpleModal with a transparent wrapper so
 * reception tests can interact with modal content (inputs, selects, buttons)
 * without Radix Dialog's portal rendering and focus-trapping interfering with
 * userEvent interactions inside JSDOM.
 */
import React from "react";

export interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
  className?: string;
  backdropClassName?: string;
}

export const SimpleModal: React.FC<SimpleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  showCloseButton = true,
}) => {
  if (!isOpen) return null;
  return (
    <div role="dialog" aria-modal="true" aria-label={title}>
      {title && <h2>{title}</h2>}
      {showCloseButton && (
        <button type="button" aria-label="Close modal" onClick={onClose}>
          ×
        </button>
      )}
      <div>{children}</div>
      {footer && <div>{footer}</div>}
    </div>
  );
};

export default SimpleModal;
