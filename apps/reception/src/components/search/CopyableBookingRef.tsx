// /src/components/bookingSearch/CopyableBookingRef.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CheckIcon, ClipboardIcon } from "@heroicons/react/24/solid";

/**
 * Display a booking reference that copies itself to clipboard on click.
 */
export interface CopyableBookingRefProps {
  text: string;
}

const CopyableBookingRef: React.FC<CopyableBookingRefProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), 2_000);
    });
  }, [text]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy booking reference"
      className="group inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:text-darkAccentGreen"
    >
      <span className="underline">{text}</span>
      {copied ? (
        <CheckIcon
          className="h-4 w-4 text-green-600 transition-opacity duration-150 dark:text-darkAccentGreen"
          aria-label="Copied!"
        />
      ) : (
        <ClipboardIcon
          className="h-4 w-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:text-darkAccentGreen"
          aria-hidden="true"
        />
      )}
    </button>
  );
};

export default React.memo(CopyableBookingRef);
