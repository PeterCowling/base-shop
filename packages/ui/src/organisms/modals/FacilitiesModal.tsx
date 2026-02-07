import { type ComponentPropsWithoutRef, memo } from "react";
import { DialogTitle } from "@radix-ui/react-dialog";

import { ModalFooterButton, ModalFrame, ModalPanel } from "./primitives";
import type { FacilitiesModalCategory, FacilitiesModalCopy } from "./types";

const FACILITIES_MODAL_TEST_ID = "facilities-modal";

export interface FacilitiesModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly categories: FacilitiesModalCategory[];
  readonly copy: FacilitiesModalCopy;
  readonly testId?: string;
}

const Grid = memo(function Grid({ className, ...rest }: ComponentPropsWithoutRef<"div">): JSX.Element {
  const base = "grid";
  return <div className={className ? `${base} ${className}` : base} {...rest} />;
});

function FacilitiesModal({
  isOpen,
  onClose,
  categories,
  copy,
  testId = FACILITIES_MODAL_TEST_ID,
}: FacilitiesModalProps): JSX.Element | null {
  if (!isOpen) return null;

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      testId={testId}
      overlayClassName="layer-modal-backdrop motion-safe:animate-in motion-safe:animate-fade-in duration-200"
      contentClassName="layer-modal-container"
    >
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <ModalPanel
          widthClassName={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */ "w-full max-w-2xl"}
          className="layer-modal-panel pointer-events-auto transform bg-brand-bg p-6 text-start dark:bg-brand-text dark:text-brand-surface motion-safe:animate-in motion-safe:animate-fade-in motion-safe:animate-zoom-in-95 duration-200"
        >
          <DialogTitle className="mb-4 text-xl font-semibold text-brand-heading text-shadow-sm [--tw-text-shadow-color:theme(colors.slate.500/0.3)]">
            {copy.title}
          </DialogTitle>

          <div className="modal-scroll-area pe-1.5">
            <Grid className="grid-cols-1 gap-6 md:grid-cols-2">
              {categories.map(({ title, items }) => (
                <section key={title}>
                  <h4 className="mb-2 font-medium text-brand-text">{title}</h4>
                  <ul className="list-inside list-disc space-y-1 text-sm text-brand-text/80">
                    {items.map((item) => (
                      <li key={item} className="[overflow-wrap:anywhere]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </Grid>
          </div>

          <div className="mt-6 text-end">
            <ModalFooterButton onClick={onClose}>{copy.closeButton}</ModalFooterButton>
          </div>
        </ModalPanel>
      </div>
    </ModalFrame>
  );
}

export default memo(FacilitiesModal);
