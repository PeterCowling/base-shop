"use client";
import * as React from "react";
import { useTranslations } from "@acme/i18n";
import { cn } from "../../utils/style";

export interface ARViewerProps extends React.HTMLAttributes<HTMLElement> {
  src: string;
  /** Optional accessible name for the 3D model. */
  ariaLabel?: string;
  /** Rendered while the viewer script is loading. */
  fallback?: React.ReactNode;
  /** Callback when the model-viewer script has loaded. */
  onReady?: () => void;
  /** Callback when the script fails to load. */
  onError?: (error: unknown) => void;
}

const DEFAULT_MODEL_VIEWER_SRC =
  /* i18n-exempt -- DS-1234 [ttl=2025-11-30] — external script URL, not user-facing copy */
  "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";

let modelViewerPromise: Promise<void> | null = null;

const ensureModelViewer = (src?: string) => {
  if (typeof window === "undefined") return Promise.resolve();
  if (customElements.get("model-viewer")) return Promise.resolve();
  if (modelViewerPromise) return modelViewerPromise;

  modelViewerPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.type = "module";
    script.src = src && src.length > 0 ? src : DEFAULT_MODEL_VIEWER_SRC;
    script.onload = () => resolve();
    script.onerror = (error) => reject(error);
    document.head.appendChild(script);
  });

  return modelViewerPromise;
};

export function ARViewer({
  src,
  className,
  ariaLabel,
  fallback,
  onReady,
  onError,
  ...props
}: ARViewerProps) {
  const t = useTranslations();
  const fallbackContent = fallback ?? (t("ar.viewer.loading") as string);
  const [ready, setReady] = React.useState<boolean>(
    typeof window !== "undefined" && Boolean(customElements.get("model-viewer")),
  );

  React.useEffect(() => {
    let mounted = true;
    ensureModelViewer(process.env.NEXT_PUBLIC_MODEL_VIEWER_SRC)
      .then(() => {
        if (!mounted) return;
        setReady(true);
        onReady?.();
      })
      .catch((error) => {
        if (!mounted) return;
        onError?.(error);
      });
    return () => {
      mounted = false;
    };
  }, [onReady, onError]);

  if (!ready) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn("flex h-full w-full items-center justify-center text-sm text-muted-foreground", className)} // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
      >
        {fallbackContent}
      </div>
    );
  }

  return (
    <model-viewer
      src={src}
      ar
      camera-controls
      className={cn(
        "h-full w-full", // i18n-exempt -- DS-1234 [ttl=2025-11-30] — CSS utility class names
        className,
      )}
      aria-label={ariaLabel}
      {...props}
    />
  );
}
