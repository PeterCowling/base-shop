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
        "group relative aspect-square overflow-hidden rounded-t-lg shadow-md transition-shadow duration-300 " +
        (isInteractive ? "cursor-pointer" : "cursor-default")
      }
    >
	      {isInteractive ? (
	        <button
	          type="button"
	          onClick={handleClick}
	          aria-label={labels.enlarge}
	          className="block min-h-10 min-w-10 h-full w-full focus-visible:outline-2 focus-visible:outline-brand-primary"
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
          className="inline-flex size-10 items-center justify-center text-sm font-semibold transition hover:text-brand-terra"
        >
          &lt;
        </button>
        <span className="text-xs">
          {imageIndex + 1}/{totalImages}
        </span>
        <button
          type="button"
          onClick={handleNext}
          aria-label={labels.nextAria}
          className="inline-flex size-10 items-center justify-center text-sm font-semibold transition hover:text-brand-terra"
        >
          &gt;
        </button>
      </div>
    </div>
  );
}

export const RoomImage = memo(RoomImageBase);
RoomImage.displayName = "RoomImage";

export default RoomImage;
