import { type ComponentPropsWithoutRef, memo } from "react";
import clsx from "clsx";

import { ModalFooterButton, ModalFrame, ModalPanel, ModalScrollArea } from "./primitives";
import type { LanguageModalCopy, LanguageOption } from "./types";

const DEFAULT_TEST_ID = "language-modal";

const OPTION_BASE = [
  "inline-flex",
  "min-h-11",
  "min-w-11",
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

const OPTION_INACTIVE = [
  "border-brand-primary/30",
  "bg-brand-surface/70",
  "text-brand-heading",
  "hover:bg-brand-primary/10",
  "dark:border-brand-secondary/40",
  "dark:bg-brand-surface/10",
  "dark:text-brand-surface",
  "dark:hover:bg-brand-secondary/20",
] as const;

const OPTION_INTERACTION = [
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-brand-primary",
  "focus-visible:ring-offset-2",
  "focus-visible:ring-offset-brand-bg",
  "dark:focus-visible:ring-offset-brand-text",
  "sm:basis-1/2",
] as const;

const OPTION_ACTIVE = [
  "border-brand-primary",
  "bg-brand-primary",
  "text-brand-bg",
  "hover:bg-brand-primary/90",
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

// Cluster: layout wrapper for language options — scroll handled by ModalScrollArea (TASK-07)
const Cluster = memo(function Cluster({ className, ...rest }: ComponentPropsWithoutRef<"div">): JSX.Element {
  const base =
    /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
    "flex flex-wrap gap-2 pr-1";
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

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      testId={testId}
      title={copy.title}
      overlayClassName="layer-modal-backdrop motion-safe:animate-in motion-safe:animate-fade-in duration-200"
      contentClassName="layer-modal-container"
    >
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <ModalPanel
          widthClassName={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */ "w-full sm:w-96"}
          data-theme={theme}
          className="layer-modal-panel transform p-6 text-start motion-safe:animate-in motion-safe:animate-fade-in motion-safe:animate-zoom-in-95 duration-200 flex max-h-dvh flex-col"
        >
          <h2 className="mb-4 text-xl font-semibold text-brand-heading">
            {copy.title}
          </h2>

          {/* ModalScrollArea enforces single-container scroll contract (TASK-07) */}
          <ModalScrollArea className="flex-1">
          <Cluster>
            {options.map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => onSelect(code)}
                aria-current={code === currentCode ? "true" : undefined}
                className={clsx(
                  OPTION_BASE,
                  OPTION_INTERACTION,
                  code === currentCode ? OPTION_ACTIVE : OPTION_INACTIVE,
                )}
              >
                {label}
              </button>
            ))}
          </Cluster>
          </ModalScrollArea>

          <div className="mt-6 text-end">
            <ModalFooterButton
              onClick={onClose}
              className="border border-brand-primary bg-transparent text-brand-primary shadow-none drop-shadow-none hover:bg-brand-primary/10 dark:border-brand-secondary dark:bg-transparent dark:text-brand-secondary dark:hover:bg-brand-secondary/15"
            >
              {copy.closeLabel}
            </ModalFooterButton>
          </div>
        </ModalPanel>
      </div>
    </ModalFrame>
  );
}

export default memo(LanguageModal);
