/* i18n-exempt file -- ABC-123 [ttl=2026-12-31] class names and UI symbols are not user-facing copy */
import { memo, type MouseEvent, useCallback } from "react";

import { resolveAssetPath } from "../shared/media";
import type { RoomCardImageLabels } from "../types/roomCard";

import CfImage from "./CfImage";

export interface RoomImageProps {
  image: string;
  imageIndex: number;
  totalImages: number;
  onPrev: () => void;
  onNext: () => void;
  onEnlarge?: () => void;
  alt: string;
  labels: RoomCardImageLabels;
}

function RoomImageBase({
  image,
  imageIndex,
  totalImages,
  onPrev,
  onNext,
  onEnlarge,
  alt,
  labels,
}: RoomImageProps): JSX.Element {
  const src = resolveAssetPath(image);
  const isInteractive = typeof onEnlarge === "function";

  const handleClick = useCallback(() => {
    onEnlarge?.();
  }, [onEnlarge]);

  const handlePrev = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onPrev();
    },
    [onPrev]
  );

  const handleNext = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onNext();
    },
    [onNext]
  );

  return (
    <div
      className={
        "group relative aspect-[4/3] overflow-hidden rounded-t-lg shadow-md transition-shadow duration-300 " +
        (isInteractive ? "cursor-pointer" : "cursor-default")
      }
    >
	      {isInteractive ? (
	        <button
	          type="button"
	          onClick={handleClick}
	          aria-label={labels.enlarge}
	          className="block min-h-11 min-w-11 h-full w-full focus-visible:outline-2 focus-visible:outline-brand-primary"
	        >
          <CfImage
            src={src}
            preset="gallery"
            alt={alt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </button>
      ) : (
        <CfImage
          src={src}
          preset="gallery"
          alt={alt}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}

      {isInteractive && (
        <span className="absolute inset-inline-start-2 inset-block-end-2 rounded bg-brand-primary/80 px-2 py-1 text-xs text-brand-bg opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:text-brand-text">
          {labels.enlarge}
        </span>
      )}

      <div className="absolute inset-block-end-2 inset-inline-end-2 flex items-center space-x-1 rounded-lg bg-brand-bg/70 p-1 backdrop-blur-md dark:bg-brand-text/70">
        <button
          type="button"
          onClick={handlePrev}
          aria-label={labels.prevAria}
          className="inline-flex size-11 items-center justify-center transition hover:text-brand-terra"
        >
          <svg aria-hidden="true" className="size-4" viewBox="0 0 20 20" fill="currentColor" focusable="false">
            <path d="M12.78 4.22a.75.75 0 0 1 0 1.06L8.06 10l4.72 4.72a.75.75 0 1 1-1.06 1.06l-5.25-5.25a.75.75 0 0 1 0-1.06l5.25-5.25a.75.75 0 0 1 1.06 0Z" />
          </svg>
        </button>
        <span className="text-xs">
          {imageIndex + 1}/{totalImages}
        </span>
        <button
          type="button"
          onClick={handleNext}
          aria-label={labels.nextAria}
          className="inline-flex size-11 items-center justify-center transition hover:text-brand-terra"
        >
          <svg aria-hidden="true" className="size-4" viewBox="0 0 20 20" fill="currentColor" focusable="false">
            <path d="M7.22 4.22a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06l-5.25 5.25a.75.75 0 1 1-1.06-1.06L11.94 10 7.22 5.28a.75.75 0 0 1 0-1.06Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export const RoomImage = memo(RoomImageBase);
RoomImage.displayName = "RoomImage";

export default RoomImage;
