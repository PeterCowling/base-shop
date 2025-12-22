import { memo } from "react";
import { ModalFooterButton, ModalOverlay, ModalPanel } from "./primitives";
import type { OffersModalCopy } from "./types";

const OFFERS_MODAL_TITLE_ID = "offers-modal-title";
const OFFERS_MODAL_DESCRIPTION_ID = "offers-modal-description";
const DEFAULT_TEST_ID = "offers-modal";

export interface OffersModalProps {
  readonly isOpen: boolean;
  readonly copy: OffersModalCopy;
  readonly onClose: () => void;
  readonly onReserve: () => void;
  readonly testId?: string;
}

function OffersModal({
  isOpen,
  copy,
  onClose,
  onReserve,
  testId = DEFAULT_TEST_ID,
}: OffersModalProps): JSX.Element | null {
  if (!isOpen) return null;

  return (
    <div className="relative" data-testid={testId}>
      <ModalOverlay
        role="presentation"
        animated
        className="z-50 px-4 py-6"
      />

      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
        <ModalPanel
          widthClassName={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */ "w-full sm:w-96"}
          className="relative pointer-events-auto rounded-lg bg-brand-bg p-6 text-center shadow-2xl drop-shadow-md dark:bg-brand-text dark:text-brand-surface"
          role="dialog"
          aria-modal="true"
          aria-labelledby={OFFERS_MODAL_TITLE_ID}
          aria-describedby={OFFERS_MODAL_DESCRIPTION_ID}
        >
          <button
            type="button"
            aria-label={copy.closeLabel}
            onClick={onClose}
            className="absolute end-3 top-3 inline-flex min-h-10 min-w-10 items-center justify-center rounded border border-brand-primary px-3 text-xs font-medium text-brand-primary transition-colors hover:bg-brand-primary/10"
          >
            {copy.closeLabel}
          </button>

          <h2 id={OFFERS_MODAL_TITLE_ID} className="mb-4 text-2xl font-semibold text-brand-primary"> 
            {copy.title}
          </h2>

          <p
            id={OFFERS_MODAL_DESCRIPTION_ID}
            className="mx-auto mb-4 text-pretty text-brand-text sm:w-80"
          >
            {copy.description}
          </p>

          <ul className="mx-auto mb-6 list-inside list-disc space-y-1 text-start">
            {copy.perks.map((perk) => (
              <li key={perk} className="font-medium">
                {perk}
              </li>
            ))}
          </ul>

          <ModalFooterButton
            className="rounded bg-brand-secondary px-6 font-medium text-brand-text drop-shadow-md hover:bg-brand-primary/90"
            onClick={onReserve}
          >
            {copy.ctaLabel}
          </ModalFooterButton>
        </ModalPanel>
      </div>
    </div>
  );
}

export default memo(OffersModal);
