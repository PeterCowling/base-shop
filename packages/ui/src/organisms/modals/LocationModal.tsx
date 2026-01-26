import { memo, useCallback, useMemo, useState } from "react";
import { DialogTitle } from "@radix-ui/react-dialog";
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
  readonly testId?: string;
}

function LocationModal({
  isOpen,
  onClose,
  copy,
  hostelAddress,
  testId = DEFAULT_TEST_ID,
}: LocationModalProps): JSX.Element | null {
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [showDirections, setShowDirections] = useState<boolean>(false);

  const pinnedMap = useMemo(
    () =>
      `https://maps.google.com/maps?q=${encodeURIComponent(hostelAddress)}&t=&z=13&ie=UTF8&iwloc=&output=embed`,
    [hostelAddress],
  );

  const directions = useMemo(
    () =>
      `https://maps.google.com/maps?saddr=${encodeURIComponent(
        currentLocation,
      )}&daddr=${encodeURIComponent(hostelAddress)}&output=embed`,
    [currentLocation, hostelAddress],
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

  return (
    <ModalFrame
      isOpen={isOpen}
      onClose={onClose}
      testId={testId}
      overlayClassName="pointer-coarse:p-6 bg-black/50 p-6 backdrop-blur-sm dark:bg-black/80"
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
            "size-10",
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

        <DialogTitle className="mb-4 text-2xl font-bold text-brand-heading">
          {copy.title}
        </DialogTitle>

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
            className="min-h-10 min-w-10 rounded bg-brand-primary px-5 py-3 font-medium text-brand-bg drop-shadow-md transition-all hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            {copy.getDirections}
          </button>
          <button
            type="button"
            onClick={handleShowMapOnly}
            className="min-h-10 min-w-10 rounded bg-brand-surface px-5 py-3 font-medium text-brand-text drop-shadow-md transition-colors hover:bg-brand-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            {copy.justShowMap}
          </button>
        </div>

        <div className="relative aspect-video w-full">
          <iframe
            title={copy.title}
            data-aspect="16:9"
            className="aspect-video size-full border-0"
            loading="lazy"
            allowFullScreen
            src={showDirections ? directions : pinnedMap}
          />
        </div>
      </ModalPanel>
    </ModalFrame>
  );
}

export default memo(LocationModal);
