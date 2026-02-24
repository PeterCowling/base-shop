"use client";

import { useEffect, useMemo, useState } from "react";
import type { ImageProps } from "next/image";
import Image from "next/image";

import { Cluster } from "@acme/design-system/primitives/Cluster";
import { cn } from "@acme/design-system/utils/style";

export function XaFadeImage({
  alt,
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

  const resolvedAlt = typeof alt === "string" ? alt.trim() : "";

  return (
    <>
      {failed ? (
        <Cluster
          alignY="center"
          justify="center"
          wrap={false}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 bg-muted/20 text-xs text-muted-foreground"
        >
          {resolvedAlt ? <span className="px-3 text-center">{resolvedAlt}</span> : null}
        </Cluster>
      ) : null}
      <span aria-hidden="true" className={overlayClass} />
      <Image
        {...props}
        alt={resolvedAlt}
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
