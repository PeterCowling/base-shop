import React, { useCallback, useEffect, useRef, useState } from "react";

export interface CopyBookingRefPillProps {
  bookingRef?: string;
}

const CopyBookingRefPill: React.FC<CopyBookingRefPillProps> = ({
  bookingRef,
}) => {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    if (!bookingRef) {
      return;
    }
    const result = navigator.clipboard?.writeText?.(bookingRef);
    if (result && typeof (result as Promise<void>).then === "function") {
      result.then(() => {
        setCopied(true);
        timeoutRef.current = setTimeout(() => setCopied(false), 2000);
      });
    } else {
      setCopied(true);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, [bookingRef]);

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
      className="inline-flex items-center rounded-full bg-gray-200 px-2 py-0.5 text-xs font-semibold text-gray-800 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:bg-darkSurface dark:text-darkAccentGreen"
      title="Copy booking reference"
    >
      {copied ? "Copied!" : "copy"}
    </button>
  );
};

export default React.memo(CopyBookingRefPill);
