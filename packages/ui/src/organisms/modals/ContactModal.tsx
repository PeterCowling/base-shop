import { memo, useCallback } from "react";

import { ModalFooterButton, ModalFrame, ModalPanel } from "./primitives";
import type { ContactModalCopy } from "./types";

const CONTACT_MODAL_TITLE_ID = "contact-modal-title";
const DEFAULT_TEST_ID = "contact-modal";

const CLOSE_BUTTON_CLASSNAMES = [
  "absolute",
  "end-4",
  "top-4",
  "inline-flex",
  "size-10",
  "items-center",
  "justify-center",
  "rounded-full",
  "text-brand-text",
  "transition-colors",
  "hover:text-brand-heading",
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-brand-primary",
  "focus-visible:ring-offset-2",
] as const;

function CloseIcon(): JSX.Element {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" focusable="false">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export interface ContactModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly copy: ContactModalCopy;
  readonly email?: string;
  readonly onEmailClick?: (email?: string) => void;
  readonly testId?: string;
}

function ContactModal({
  isOpen,
  onClose,
  copy,
  email,
  onEmailClick,
  testId = DEFAULT_TEST_ID,
}: ContactModalProps): JSX.Element | null {
  const handleEmailClick = useCallback((): void => {
    onEmailClick?.(email);
    if (email) window.location.href = `mailto:${email}`;
  }, [onEmailClick, email]);

  if (!isOpen) return null;

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      testId={testId}
      overlayClassName="flex items-center justify-center"
      ariaLabelledBy={CONTACT_MODAL_TITLE_ID}
    >
      <ModalPanel
        widthClassName={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */ "w-full max-w-md"}
        className="relative pointer-events-auto animate-fade-in rounded-2xl bg-brand-bg p-6 text-brand-text shadow-2xl drop-shadow-brand-primary-10 duration-200 dark:bg-brand-text dark:text-brand-surface"
      >
        <button type="button" aria-label={copy.closeLabel} onClick={onClose} className={CLOSE_BUTTON_CLASSNAMES.join(" ")}>
          <CloseIcon />
        </button>

        <h2
          id={CONTACT_MODAL_TITLE_ID}
          className="mb-4 text-2xl font-bold text-brand-heading text-shadow-sm [--tw-text-shadow-color:theme(colors.slate.500/0.3)]"
        >
          {copy.title}
        </h2>
        <p className="mb-6 text-brand-text/80">{copy.description}</p>

        <button
          type="button"
          onClick={handleEmailClick}
          className="min-h-10 min-w-10 rounded-full px-4 text-center font-medium text-brand-primary underline decoration-brand-primary underline-offset-2 transition-colors [overflow-wrap:anywhere] hover:decoration-brand-bougainvillea focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          {email || copy.revealEmail}
        </button>

        <div className="mt-8 text-end">
          <ModalFooterButton onClick={onClose}>{copy.footerButton}</ModalFooterButton>
        </div>
      </ModalPanel>
    </ModalFrame>
  );
}

export default memo(ContactModal);
