import { memo, useCallback, useMemo, useState } from "react";
import clsx from "clsx";

import { ModalFrame, ModalPanel } from "./primitives";
import type { LocationModalCopy } from "./types";

const CURRENT_LOCATION_INPUT_ID = "current-location";
const DEFAULT_TEST_ID = "location-modal";

export interface LocationModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly copy: LocationModalCopy;
  readonly hostelAddress: string;
  readonly mapsEmbedKey?: string;
  readonly testId?: string;
}

function LocationModal({
  isOpen,
  onClose,
  copy,
  hostelAddress,
  mapsEmbedKey,
  testId = DEFAULT_TEST_ID,
}: LocationModalProps): JSX.Element | null {
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [showDirections, setShowDirections] = useState<boolean>(false);

  const pinnedMap = useMemo(
    () =>
      mapsEmbedKey && mapsEmbedKey.length > 0
        ? `https://www.google.com/maps/embed/v1/place?key=${mapsEmbedKey}&q=${encodeURIComponent(hostelAddress)}&zoom=13`
        : null,
    [mapsEmbedKey, hostelAddress],
  );

  const directions = useMemo(
    () =>
      mapsEmbedKey && mapsEmbedKey.length > 0
        ? `https://www.google.com/maps/embed/v1/directions?key=${mapsEmbedKey}&origin=${encodeURIComponent(currentLocation)}&destination=${encodeURIComponent(hostelAddress)}`
        : null,
    [mapsEmbedKey, currentLocation, hostelAddress],
  );

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>): void => {
    setCurrentLocation(event.target.value);
  }, []);

  const handleGetDirections = useCallback((): void => {
    setShowDirections(currentLocation.trim().length > 0);
  }, [currentLocation]);

  const handleShowMapOnly = useCallback((): void => {
    setShowDirections(false);
  }, []);

  if (!isOpen) return null;

  const iframeSrc = showDirections ? directions : pinnedMap;
  const fallbackHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hostelAddress)}`;

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      testId={testId}
      title={copy.title}
      overlayClassName="pointer-coarse:p-6 bg-surface/50 p-6 backdrop-blur-sm dark:bg-black/80"
    >
      <ModalPanel
        widthClassName={/* i18n-exempt -- ABC-123 [ttl=2026-12-31] class names */ "w-full sm:max-w-xl"}
        className="relative pointer-events-auto rounded-lg bg-brand-bg p-6 text-brand-text shadow-2xl drop-shadow-md dark:bg-brand-text dark:text-brand-surface"
        data-element="dialog"
      >
        <button
          type="button"
          aria-label={copy.closeLabel}
          onClick={onClose}
          className={clsx(
            "absolute",
            "top-4",
            "end-4",
            "inline-flex",
            "size-11",
            "items-center",
            "justify-center",
            "rounded-full",
            "text-xl",
            "font-bold",
            "text-brand-text",
            "transition-colors",
            "hover:text-brand-heading",
            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-brand-primary",
          )}
        >
          ×
        </button>

        <h2 className="mb-4 text-2xl font-bold text-brand-heading">
          {copy.title}
        </h2>

        <div className="mb-4">
          <label htmlFor={CURRENT_LOCATION_INPUT_ID} className="mb-1 block font-semibold text-brand-text">
            {copy.inputLabel}
          </label>
          <input
            id={CURRENT_LOCATION_INPUT_ID}
            type="text"
            value={currentLocation}
            onChange={handleInputChange}
            placeholder={copy.inputPlaceholder}
            className="w-full rounded border border-brand-surface px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          />
        </div>

        <div className="mb-6 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={handleGetDirections}
            className="min-h-11 min-w-11 rounded bg-brand-primary px-5 py-3 font-medium text-brand-bg drop-shadow-md transition-all hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            {copy.getDirections}
          </button>
          <button
            type="button"
            onClick={handleShowMapOnly}
            className="min-h-11 min-w-11 rounded bg-brand-surface px-5 py-3 font-medium text-brand-text drop-shadow-md transition-colors hover:bg-brand-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            {copy.justShowMap}
          </button>
        </div>

        <div className="relative aspect-video w-full">
          {iframeSrc ? (
            <iframe
              title={copy.title}
              data-aspect="16:9"
              className="aspect-video size-full border-0"
              loading="lazy"
              allowFullScreen
              src={iframeSrc}
            />
          ) : (
            <a
              href={fallbackHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex aspect-video size-full items-center justify-center rounded border border-brand-surface text-brand-primary underline-offset-4 hover:underline min-h-11 min-w-11"
            >
              {copy.title}
            </a>
          )}
        </div>
      </ModalPanel>
    </ModalFrame>
  );
}

export default memo(LocationModal);
