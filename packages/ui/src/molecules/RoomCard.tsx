import { memo, useCallback, useEffect, useMemo, useState } from "react";
import clsx from "clsx";

import RoomImage from "../atoms/RoomImage";
import VisuallyHidden from "../atoms/VisuallyHidden";
import { Stack } from "../components/atoms/primitives/Stack";
import { resolveAssetPath } from "../shared/media";
import { ROOM_CARD_TEST_IDS } from "../shared/testIds";
import type {
  RoomCardAction,
  RoomCardFacility,
  RoomCardFullscreenRequest,
  RoomCardImageLabels,
  RoomCardPrice,
  RoomCardProps,
} from "../types/roomCard";

export const ROOM_CARD_ACTION_BUTTON_CLASS = clsx(
  "inline-flex",
  "min-h-11",
  "min-w-11",
  "items-center",
  "justify-center",
  "rounded-lg",
  "bg-brand-secondary",
  "px-4",
  "py-2",
  "text-sm",
  "font-medium",
  "text-brand-text",
  "transition-opacity",
  "duration-200",
  "hover:bg-brand-primary/90",
  "hover:text-brand-bg",
  "focus-visible:outline-2",
  "focus-visible:outline-brand-primary",
  "disabled:cursor-not-allowed",
  "disabled:opacity-50",
  "md:px-6",
  "md:text-base",
  "lg:px-8",
  "lg:py-3",
  "lg:text-lg"
);

export { ROOM_CARD_TEST_IDS } from "../shared/testIds";

const DEFAULT_IMAGE_LABELS: RoomCardImageLabels = {
  enlarge: "View image",
  // i18n-exempt -- UI-1000 [ttl=2026-12-31] Fallback aria label; prefer consumer-provided copy.
  prevAria: "Previous image",
  nextAria: "Next image",
  // i18n-exempt -- UI-1000 [ttl=2026-12-31] Fallback empty-state copy; prefer consumer-provided copy.
  empty: "No image available",
};

function getCurrentImage(images: string[], index: number): string | undefined {
  if (!images.length) return undefined;
  return images[index] ?? images[0];
}

function FacilitiesList({ facilities }: { facilities?: RoomCardFacility[] }): JSX.Element | null {
  if (!facilities?.length) return null;

  return (
    <div className="my-4 space-y-2 text-sm">
      {facilities.map(({ id, label, icon }) => (
        <div key={id} className="flex items-start gap-2">
          {icon}
          <p className="leading-snug">{label}</p>
        </div>
      ))}
    </div>
  );
}

function PriceBlock({ price }: { price?: RoomCardPrice }): JSX.Element | null {
  if (!price) return null;

  if (price.loading) {
    const skeletonId = price.skeletonTestId ?? ROOM_CARD_TEST_IDS.priceSkeleton;
    return (
      <>
        <p
          data-cy={skeletonId}
          data-testid={skeletonId}
          aria-hidden="true"
          className="mb-1 min-h-5 w-20 animate-pulse rounded bg-brand-surface"
        />
        {price.loadingLabel ? <span className="sr-only">{price.loadingLabel}</span> : null}
      </>
    );
  }

  return (
    <>
      {price.formatted ? (
        <div className="mb-1 flex items-center gap-2 text-base font-medium text-brand-primary dark:text-brand-secondary">
          <span>{price.formatted}</span>
          {price.info ? (
            <span className="inline-flex items-center">
              <span
                className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full border border-current text-xs font-semibold leading-none text-current"
                title={price.info}
                aria-hidden="true"
              >
                i
              </span>
              <VisuallyHidden>{price.info}</VisuallyHidden>
            </span>
          ) : null}
        </div>
      ) : null}

      {price.soldOut && price.soldOutLabel ? (
        <p className="mb-3 text-base font-medium text-brand-primary dark:text-brand-secondary">
          {price.soldOutLabel}
        </p>
      ) : null}
    </>
  );
}

function splitActionLabel(label: string): string[] {
  const trimmed = label.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(/\s+[–—-]\s+/u);
  if (parts.length <= 1) return [trimmed];

  const [first, ...rest] = parts;
  return [first, rest.join(" ")];
}

function ActionButtons({ actions }: { actions?: RoomCardAction[] }): JSX.Element | null {
  if (!actions?.length) return null;

  return (
    <Stack gap={2} className="mt-auto sm:flex-row">
      {actions.map((action) => {
        const trimmedLabel = action.label.trim();
        const normalisedLabel = trimmedLabel.replace(/\s+/g, " ");
        const lines = splitActionLabel(normalisedLabel || action.label);
        const accessibleLabel = normalisedLabel || action.label;

        return (
          <button
            key={action.id}
            type="button"
            onClick={action.onSelect}
            disabled={action.disabled}
            aria-disabled={action.disabled}
            aria-label={accessibleLabel}
            className={ROOM_CARD_ACTION_BUTTON_CLASS}
          >
            {lines.length > 1 ? (
              <>
                <VisuallyHidden>{accessibleLabel}</VisuallyHidden>
                <span
                  aria-hidden="true"
                  className="text-center leading-tight"
                >
                  {lines.map((line) => (
                    <span key={`${action.id}-${line}`} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </>
            ) : (
              action.label
            )}
          </button>
        );
      })}
    </Stack>
  );
}

function RoomCardComponent({
  id,
  title,
  images,
  imageAlt,
  imageLabels,
  facilities,
  price,
  actions,
  className,
  lang,
  onRequestFullscreen,
}: RoomCardProps): JSX.Element {
  const [imageIndex, setImageIndex] = useState(0);
  const galleryImages = useMemo(() => {
    if (!Array.isArray(images) || !images.length) return [] as string[];
    return images.filter((image): image is string => Boolean(image));
  }, [images]);

  const totalImages = galleryImages.length;
  const labels = useMemo(() => ({ ...DEFAULT_IMAGE_LABELS, ...imageLabels }), [imageLabels]);

  const currentImage = useMemo(
    () => getCurrentImage(galleryImages, imageIndex),
    [galleryImages, imageIndex]
  );

  useEffect(() => {
    if (!totalImages && imageIndex !== 0) {
      setImageIndex(0);
      return;
    }

    if (totalImages && imageIndex > totalImages - 1) {
      setImageIndex(totalImages - 1);
    }
  }, [imageIndex, totalImages]);

  const goToNext = useCallback(() => {
    setImageIndex((prev) => {
      if (!totalImages) return prev ? 0 : prev;
      return prev === totalImages - 1 ? 0 : prev + 1;
    });
  }, [totalImages]);

  const goToPrev = useCallback(() => {
    setImageIndex((prev) => {
      if (!totalImages) return prev ? 0 : prev;
      return prev === 0 ? totalImages - 1 : prev - 1;
    });
  }, [totalImages]);

  const handleEnlarge = useCallback(() => {
    if (!currentImage || !onRequestFullscreen) return;

    const payload: RoomCardFullscreenRequest = {
      image: resolveAssetPath(currentImage),
      index: imageIndex,
      title,
    };

    onRequestFullscreen(payload);
  }, [currentImage, imageIndex, onRequestFullscreen, title]);

  return (
    <article
      id={id}
      lang={lang}
      className={clsx(
        /* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */
        "group flex flex-col overflow-hidden rounded-lg border border-brand-surface bg-brand-bg shadow-sm transition-shadow duration-300 hover:shadow-lg dark:border-brand-surface/20 dark:bg-brand-text",
        className
      )}
    >
      {currentImage ? (
        <RoomImage
          image={currentImage}
          imageIndex={imageIndex}
          totalImages={totalImages}
          onPrev={goToPrev}
          onNext={goToNext}
          onEnlarge={onRequestFullscreen ? handleEnlarge : undefined}
          alt={imageAlt}
          labels={labels}
        />
      ) : (
        <Stack align="center" className="aspect-square justify-center bg-brand-surface text-sm text-brand-outline">
          {labels.empty ?? DEFAULT_IMAGE_LABELS.empty}
        </Stack>
      )}

      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 text-lg font-semibold uppercase tracking-wide text-brand-primary">{title}</h3>

        <PriceBlock price={price} />

        <FacilitiesList facilities={facilities} />

        <ActionButtons actions={actions} />
      </div>
    </article>
  );
}

export const RoomCard = memo(RoomCardComponent);
RoomCard.displayName = "RoomCard";

export default RoomCard;
