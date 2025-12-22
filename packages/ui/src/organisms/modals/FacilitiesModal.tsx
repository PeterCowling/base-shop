import { Dialog, Transition } from "@headlessui/react";
import { Fragment, memo, type ComponentPropsWithoutRef } from "react";
import { ModalContainer, ModalOverlay, ModalPanel, ModalFooterButton } from "./primitives";
import type { FacilitiesModalCategory, FacilitiesModalCopy } from "./types";

const FACILITIES_MODAL_TEST_ID = "facilities-modal";

const OVERLAY_ENTER = [
  "motion-safe:animate-in",
  "motion-safe:animate-fade-in",
  "duration-200",
] as const;

const OVERLAY_LEAVE = [
  "motion-safe:animate-out",
  "motion-safe:animate-fade-out",
  "duration-150",
] as const;

const PANEL_ENTER = [
  "motion-safe:animate-in",
  "motion-safe:animate-fade-in",
  "motion-safe:animate-zoom-in-95",
  "duration-200",
] as const;

const PANEL_LEAVE = [
  "motion-safe:animate-out",
  "motion-safe:animate-fade-out",
  "motion-safe:animate-zoom-out-95",
  "duration-150",
] as const;

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
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="layer-modal relative" onClose={onClose} data-testid={testId}>
        <Transition.Child as={Fragment} enter={OVERLAY_ENTER.join(" ")} leave={OVERLAY_LEAVE.join(" ")}>
          <ModalOverlay animated className="layer-modal-backdrop" />
        </Transition.Child>

        <ModalContainer className="layer-modal-container">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter={PANEL_ENTER.join(" ")} leave={PANEL_LEAVE.join(" ")}>
              <Dialog.Panel
                as={ModalPanel}
                widthClassName={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */ "w-full max-w-2xl"}
                className="layer-modal-panel transform bg-brand-bg p-6 text-start dark:bg-brand-text dark:text-brand-surface"
              >
                <Dialog.Title
                  as="h3"
                  className="mb-4 text-xl font-semibold text-brand-heading text-shadow-sm [--tw-text-shadow-color:theme(colors.slate.500/0.3)]"
                >
                  {copy.title}
                </Dialog.Title>

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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </ModalContainer>
      </Dialog>
    </Transition>
  );
}

export default memo(FacilitiesModal);
