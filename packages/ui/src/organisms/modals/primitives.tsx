import {
  type ButtonHTMLAttributes,
  forwardRef,
  type HTMLAttributes,
  type Ref,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import clsx from "clsx";

/** Shared frosted-glass overlay used by the modal suite. */
export interface ModalOverlayProps extends HTMLAttributes<HTMLDivElement> {
  /** Include backdrop animations when motion is allowed. */
  animated?: boolean;
}

const OVERLAY_BASE = [
  "fixed",
  "inset-0",
  "z-modal-backdrop",
  "pointer-coarse:p-6",
  "bg-foreground/60",
  "backdrop-blur-sm",
  "dark:bg-foreground/80",
];

const OVERLAY_ANIMATION = [
  "motion-safe:animate-in",
  "motion-safe:animate-fade-in",
  "duration-200",
];

export const ModalOverlay = forwardRef(function ModalOverlay(
  { animated = true, className, ...rest }: ModalOverlayProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  const classes = clsx(OVERLAY_BASE, animated && OVERLAY_ANIMATION, className);
  return <div ref={ref} className={classes} {...rest} />;
});

export interface ModalFrameProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Accessible title rendered as a visually-hidden DialogTitle. Radix uses this
   *  to wire up aria-labelledby automatically. Defaults to "Dialog". */
  title?: string;
  overlayClassName?: string;
  contentClassName?: string;
  testId?: string;
  ariaDescribedBy?: string;
}

const FRAME_BASE = [
  "fixed",
  "inset-0",
  "z-modal",
  "pointer-events-none",
  "flex",
  "items-center",
  "justify-center",
];

export function ModalFrame({
  isOpen,
  onClose,
  children,
  title,
  overlayClassName,
  contentClassName,
  testId,
  ariaDescribedBy,
}: ModalFrameProps): JSX.Element | null {
  if (!isOpen) return null;

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={clsx(OVERLAY_BASE, overlayClassName)} />
        <DialogPrimitive.Content
          className={clsx(FRAME_BASE, contentClassName)}
          aria-describedby={ariaDescribedBy}
          data-cy={testId}
          data-testid={testId}
        >
          {/* DialogTitle is inside DialogContent so it commits in the same render
              cycle as TitleWarning. Both are portal children, so when TitleWarning's
              useEffect fires, document.getElementById(context.titleId) finds this
              element immediately. No cross-render-cycle timing issues. */}
          <DialogPrimitive.Title className="sr-only">
            {title ?? "Dialog"}
          </DialogPrimitive.Title>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

/** Shared container that centres modal panels with pointer-event guards. */
export type ModalContainerProps = HTMLAttributes<HTMLDivElement>;

const CONTAINER_BASE = [
  "fixed",
  "inset-0",
  "flex",
  "items-center",
  "justify-center",
  "overflow-y-auto",
  "pointer-events-none",
];

export const ModalContainer = forwardRef(function ModalContainer(
  { className, ...rest }: ModalContainerProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  const classes = clsx(CONTAINER_BASE, className);
  return <div ref={ref} className={classes} {...rest} />;
});

/** Shared panel shell with dark-mode token support. */
export interface ModalPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Width utility applied to the panel (e.g. `sm:w-96`). */
  widthClassName?: string;
}

const PANEL_BASE = [
  "pointer-events-auto",
  "overflow-hidden",
  "rounded-2xl",
  "bg-brand-bg",
  "shadow-2xl",
  "drop-shadow-brand-primary-10",
  "text-brand-text",
  "dark:bg-brand-text",
  "dark:text-brand-surface",
];

export const ModalPanel = forwardRef(function ModalPanel(
  { widthClassName, className, ...rest }: ModalPanelProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  const classes = clsx(PANEL_BASE, widthClassName, className);
  return <div ref={ref} className={classes} {...rest} />;
});
ModalPanel.displayName = "ModalPanel";

/**
 * Viewport-bounded panel that scrolls its own content.
 *
 * Use when the entire modal body (including form fields) should be scrollable.
 * Does not include `overflow-hidden` — content is clipped via scroll instead.
 * Background page scrolling is locked by the host (ModalProvider.useModalScrollLock).
 *
 * Layout invariant contract (TASK-07):
 * - `max-h-[90dvh]` — dynamic viewport height so mobile browser chrome does not cut content.
 * - `overflow-y-auto` — content scrolls in a single container.
 * - `overscroll-contain` — prevents scroll-chaining to the background page.
 */
export interface ModalScrollPanelProps extends HTMLAttributes<HTMLDivElement> {
  widthClassName?: string;
}

const SCROLL_PANEL_BASE = [
  "pointer-events-auto",
  "overflow-x-hidden",
  "overflow-y-auto",
  "overscroll-contain",
  "max-h-[90dvh]",
  "rounded-2xl",
  "bg-brand-bg",
  "shadow-2xl",
  "drop-shadow-brand-primary-10",
  "text-brand-text",
  "dark:bg-brand-text",
  "dark:text-brand-surface",
];

export const ModalScrollPanel = forwardRef(function ModalScrollPanel(
  { widthClassName, className, ...rest }: ModalScrollPanelProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  const classes = clsx(SCROLL_PANEL_BASE, widthClassName, className);
  return <div ref={ref} className={classes} {...rest} />;
});
ModalScrollPanel.displayName = "ModalScrollPanel";

/**
 * Scrollable content zone for use inside a panel with a sticky header and/or footer.
 *
 * The parent panel must have `max-h` set to enable bounded scrolling and should use
 * `flex flex-col` so this area expands to fill available space via `flex-1`.
 *
 * Layout invariant contract (TASK-07):
 * - Single documented scroll container — no per-modal ad-hoc scroll wrappers.
 * - `overscroll-contain` — prevents scroll-chaining to background page.
 */
export type ModalScrollAreaProps = HTMLAttributes<HTMLDivElement>;

const SCROLL_AREA_BASE = ["overflow-y-auto", "overscroll-contain"];

export const ModalScrollArea = forwardRef(function ModalScrollArea(
  { className, ...rest }: ModalScrollAreaProps,
  ref: Ref<HTMLDivElement>,
): JSX.Element {
  const classes = clsx(SCROLL_AREA_BASE, className);
  return <div ref={ref} className={classes} {...rest} />;
});
ModalScrollArea.displayName = "ModalScrollArea";

/** Standard action button displayed in modal footers. */
export type ModalFooterButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

const FOOTER_BUTTON_BASE = [
  "inline-flex",
  "min-h-10",
  "min-w-10",
  "items-center",
  "justify-center",
  "rounded-md",
  "bg-brand-primary",
  "px-4",
  "py-2",
  "text-sm",
  "font-medium",
  "text-brand-bg",
  "dark:bg-brand-secondary",
  "dark:text-brand-bg",
  "drop-shadow-brand-primary-40",
  "transition-all",
  "hover:bg-brand-primary/90",
  "focus-visible:outline-none",
  "focus-visible:ring-2",
  "focus-visible:ring-brand-primary",
  "focus-visible:ring-offset-2",
  "dark:focus-visible:ring-offset-brand-surface",
];

export function ModalFooterButton({ className, ...rest }: ModalFooterButtonProps): JSX.Element {
  const classes = clsx(FOOTER_BUTTON_BASE, className);
  return <button type="button" className={classes} {...rest} />;
}
