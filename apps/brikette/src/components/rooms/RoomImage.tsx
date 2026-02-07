// file path: src/components/rooms/RoomImage.tsx
import { type KeyboardEvent, memo, type MouseEvent, useCallback } from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";

import { CfCardImage } from "@acme/ui/atoms/CfCardImage";

/* Legacy → canonical path helper */
const resolveAsset = (p: string): string => p.replace(/^\/images\//, "/img/");

export interface RoomImageProps {
  image: string;
  imageIndex: number;
  totalImages: number;
  onPrev: (e: MouseEvent<HTMLButtonElement>) => void;
  onNext: (e: MouseEvent<HTMLButtonElement>) => void;
  onEnlarge: () => void;
  alt: string;
  lang?: string;
}

function RoomImage(props: RoomImageProps): JSX.Element {
  const { image, imageIndex, totalImages, onPrev, onNext, onEnlarge, alt } = props;
  const { lang } = props;
  const translationOptions = lang ? { lng: lang } : undefined;
  const { t } = useTranslation("roomsPage", translationOptions);

  const src = resolveAsset(image);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") onEnlarge();
    },
    [onEnlarge]
  );

  return (
    <div
      className={clsx(
        "group",
        "relative",
        "aspect-square",
        "cursor-pointer",
        "overflow-hidden",
        "rounded-t-lg",
        "shadow-md",
        "transition-shadow",
        "duration-300",
        "focus-visible:outline-2",
        "focus-visible:outline-brand-primary"
      )}
      onClick={onEnlarge}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
        <CfCardImage
          src={src}
          alt={alt}
          wrapperClassName={clsx("h-full", "w-full")}
          className={clsx(
            "size-full",
            "object-cover",
            "transition-transform",
            "duration-500",
            "group-hover:scale-105"
          )}
        />

        <span
          className={clsx(
            "absolute",
            "bottom-2",
            "start-2",
            "rounded",
            "bg-brand-primary/80",
            "px-2",
            "py-1",
            "text-xs",
            "text-brand-bg",
            "opacity-0",
            "transition-opacity",
            "duration-300",
            "group-hover:opacity-100",
            "dark:text-brand-text"
          )}
        >
          {t("roomImage.clickToEnlarge")}
        </span>

        <div
          className={clsx(
            "absolute",
            "bottom-2",
            "end-2",
            "flex",
            "items-center",
            "gap-x-1",
            "rounded-lg",
            "bg-brand-bg/70",
            "p-1",
            "backdrop-blur-md",
            "dark:bg-brand-text/70"
          )}
        >
        <button
          onClick={onPrev}
          aria-label={t("roomImage.prevAria")}
          className="inline-flex size-11 items-center justify-center text-sm font-semibold transition hover:text-brand-terra"
        >
          <svg
            aria-hidden="true"
            className="size-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            focusable="false"
          >
            <path d="M12.78 4.22a.75.75 0 0 1 0 1.06L8.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z" />
          </svg>
        </button>
        <span className="text-xs">
          {t("roomImage.pagination", {
            current: imageIndex + 1,
            total: totalImages,
          })}
        </span>
        <button
          onClick={onNext}
          aria-label={t("roomImage.nextAria")}
          className="inline-flex size-11 items-center justify-center text-sm font-semibold transition hover:text-brand-terra"
        >
          <svg
            aria-hidden="true"
            className="size-4"
            viewBox="0 0 20 20"
            fill="currentColor"
            focusable="false"
          >
            <path d="M7.22 4.22a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06L11.94 10 7.22 5.28a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default memo(RoomImage);
