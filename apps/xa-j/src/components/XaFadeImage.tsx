"use client";

import { useEffect, useMemo, useState } from "react";
/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy fade image pending accessibility/i18n overhaul */
import Image from "next/image";
import type { ImageProps } from "next/image";

import { cn } from "@ui/utils/style";

export function XaFadeImage({
  className,
  onLoad,
  onLoadingComplete,
  onError,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const srcKey = useMemo(() => {
    if (typeof props.src === "string") return props.src;
    if (typeof props.src === "object" && "src" in props.src) return props.src.src;
    return "";
  }, [props.src]);

  useEffect(() => {
    // Reset when the image source changes so the fade applies per image.
    setLoaded(false);
    setFailed(false);
  }, [srcKey]);

  const imageClass = cn("relative z-0", className);
  const revealed = loaded || failed;
  const overlayClass = cn(
    "pointer-events-none absolute inset-0 z-10 bg-background transition-opacity duration-500 ease-out",
    revealed && "opacity-0",
  );

  const resolvedAlt = typeof props.alt === "string" ? props.alt.trim() : "";

  return (
    <>
      {failed ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-muted/20 text-xs text-muted-foreground"
        >
          {resolvedAlt ? <span className="px-3 text-center">{resolvedAlt}</span> : null}
        </span>
      ) : null}
      <span aria-hidden="true" className={overlayClass} />
      <Image
        {...props}
        className={cn(imageClass, failed && "opacity-0")}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
          onLoadingComplete?.(event.currentTarget);
        }}
        onError={(event) => {
          setFailed(true);
          onError?.(event);
        }}
      />
    </>
  );
}
