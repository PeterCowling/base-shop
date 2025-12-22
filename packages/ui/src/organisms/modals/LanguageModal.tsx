import { Dialog, Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, memo, type ComponentPropsWithoutRef } from "react";
import { ModalContainer, ModalOverlay, ModalPanel, ModalFooterButton } from "./primitives";
import type { LanguageModalCopy, LanguageOption } from "./types";

const DEFAULT_TEST_ID = "language-modal";

const BACKDROP_ENTER = [
  "motion-safe:animate-in",
  "motion-safe:animate-fade-in",
  "duration-200",
] as const;

const BACKDROP_LEAVE = [
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

const OPTION_BASE = [
  "inline-flex",
  "min-h-10",
  "min-w-10",
  "flex-1",
  "basis-full",
  "items-center",
  "justify-center",
  "rounded-md",
  "border",
  "border-transparent",
  "px-4",
  "py-2",
  "text-sm",
  "font-medium",
  "transition-colors",
] as const;

const OPTION_INTERACTION = [
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-brand-primary",
  "focus-visible:ring-offset-2",
  "sm:basis-1/2",
] as const;

const OPTION_ACTIVE = [
  "bg-brand-primary",
  "text-brand-heading",
  "dark:bg-brand-primary",
] as const;

export interface LanguageModalProps {
  readonly isOpen: boolean;
  readonly options: LanguageOption[];
  readonly currentCode: string;
  readonly onSelect: (code: string) => void;
  readonly onClose: () => void;
  readonly copy: LanguageModalCopy;
  readonly theme?: "light" | "dark";
  readonly testId?: string;
}

const Cluster = memo(function Cluster({ className, ...rest }: ComponentPropsWithoutRef<"div">): JSX.Element {
  const base =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "flex flex-wrap gap-2";
  return <div className={className ? `${base} ${className}` : base} {...rest} />;
});

function LanguageModal({
  isOpen,
  options,
  currentCode,
  onSelect,
  onClose,
  copy,
  theme = "light",
  testId = DEFAULT_TEST_ID,
}: LanguageModalProps): JSX.Element | null {
  if (!isOpen) return null;

  const themeClass = theme === "dark" ? "lang-dark" : "lang-light";

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="layer-modal relative" onClose={onClose} data-testid={testId}>
        <Transition.Child as={Fragment} enter={BACKDROP_ENTER.join(" ")} leave={BACKDROP_LEAVE.join(" ")}>
          <ModalOverlay animated className="layer-modal-backdrop" />
        </Transition.Child>

        <ModalContainer className="layer-modal-container">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={Fragment} enter={PANEL_ENTER.join(" ")} leave={PANEL_LEAVE.join(" ")}>
              <Dialog.Panel
                as={ModalPanel}
          widthClassName={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */ "w-full sm:w-96"}
                className="layer-modal-panel transform bg-brand-bg p-6 text-start dark:bg-brand-text dark:text-brand-surface"
              >
                <Dialog.Title className="mb-4 text-xl font-semibold text-brand-heading text-shadow-sm [--tw-text-shadow-color:theme(colors.slate.500/0.3)]">
                  {copy.title}
                </Dialog.Title>

                <Cluster>
                  {options.map(({ code, label }) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => onSelect(code)}
                      aria-current={code === currentCode ? "true" : undefined}
                      className={clsx(OPTION_BASE, themeClass, OPTION_INTERACTION, code === currentCode && OPTION_ACTIVE)}
                    >
                      {label}
                    </button>
                  ))}
                </Cluster>

                <div className="mt-6 text-end">
                  <ModalFooterButton onClick={onClose}>{copy.closeLabel}</ModalFooterButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </ModalContainer>
      </Dialog>
    </Transition>
  );
}

export default memo(LanguageModal);
