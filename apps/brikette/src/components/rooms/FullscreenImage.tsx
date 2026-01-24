// src/components/rooms/FullscreenImage.tsx
import { type ComponentPropsWithoutRef, type KeyboardEvent, memo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { CfImage } from "@/components/images/CfImage";
import { getIntrinsicSize } from "@/lib/getIntrinsicSize";

type ModalProps = ComponentPropsWithoutRef<"div">;

function Modal({ className = "", ...props }: ModalProps): JSX.Element {
  return <div className={clsx("relative", "isolate", className)} {...props} />;
}

const CLOSE_KEYS = new Set(["Escape", "Enter", " ", "Space", "Spacebar"]);

/* Legacy → canonical path helper */
const resolveAsset = (p: string): string => p.replace(/^\/images\//, "/img/");

export interface FullscreenImageProps {
  src: string;
  alt: string;
  onClose: () => void;
  lang?: string;
}

/**
 * Full‑screen, click‑to‑close light‑box for room images.
 * Adds explicit `width` & `height` attrs to comply with CI rules
 * (see AGENTS.md § <Image> requirements).
 */
function FullscreenImage({ src, alt, onClose, lang }: FullscreenImageProps): JSX.Element {
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t } = useTranslation("roomsPage", translationOptions);

  /* ────────────────────────────── handlers ───────────────────────────── */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (CLOSE_KEYS.has(e.key)) {
        e.preventDefault();
        onClose();
      }
    },
    [onClose]
  );

  /* ─────────────────────────── image sources ─────────────────────────── */
  const resolvedSrc = resolveAsset(src);

  /* ────────────────────────── intrinsic dims ─────────────────────────── */
  /* Dimensions are looked up once per src & memoised in getIntrinsicSize. */
  const { width: origW, height: origH } = getIntrinsicSize(resolvedSrc) ?? { width: 0, height: 0 };

  const aspectRatio = origW && origH ? `${origW}/${origH}` : "16/9";

  /* ────────────────────────────── render ─────────────────────────────── */
  return (
    <div className="relative">
      <Modal
        role="button"
        aria-label={t("fullscreen.closeAria")}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={onClose}
        className={clsx(
          "pointer-coarse:p-4",
          "fixed",
          "inset-0",
          "z-50",
          "grid",
          "cursor-zoom-out",
          "place-items-center",
          "bg-brand-outline/80",
          "px-6",
          "py-10",
          "backdrop-blur-sm",
          "dark:bg-brand-outline/80"
        )}
      >
        <div
          className={clsx(
            "relative",
            "flex",
            "max-h-dvh",
            "w-full",
            "justify-center"
          )}
        >
          <CfImage
            src={resolvedSrc}
            alt={alt}
            preset="hero"
            priority
            quality={90}
            data-aspect={aspectRatio}
            className={clsx("max-h-dvh", "w-full", "object-contain")}
          />

          <span
            className={clsx(
              "pointer-events-none",
              "absolute",
              "start-3",
              "top-3",
              "rounded",
              "bg-brand-outline/70",
              "px-2",
              "py-1",
              "text-xs",
              "text-brand-bg",
              "dark:bg-brand-outline/80"
            )}
          >
            {t("fullscreen.clickToClose")}
          </span>
        </div>
      </Modal>
    </div>
  );
}

export default memo(FullscreenImage);
