"use client";

import React from "react";

type Props = { children: React.ReactNode };

/**
 * Catches transient Next/webpack ChunkLoadError during dev/HMR and reloads once.
 * If the error persists after one reload, shows a minimal fallback UI.
 */
export default class ChunkReloadBoundary extends React.Component<
  Props,
  { error: Error | null }
> {
  private static RELOAD_FLAG = "cms:reloaded-on-chunk-error";

  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    const isChunkError =
      error?.name === "ChunkLoadError" || /ChunkLoadError|Loading chunk/i.test(error?.message || "");
    if (typeof window !== "undefined" && isChunkError) {
      const reloaded = sessionStorage.getItem(ChunkReloadBoundary.RELOAD_FLAG);
      if (!reloaded) {
        try {
          sessionStorage.setItem(ChunkReloadBoundary.RELOAD_FLAG, "1");
        } catch {}
        window.location.reload();
        return;
      }
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto p-6 text-center">
          {/* i18n-exempt -- CMS-1010: dev-only fallback during HMR */}
          <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
          {/* i18n-exempt -- CMS-1010: dev-only guidance during HMR */}
          <p className="mb-4 text-sm text-muted-foreground">
            We couldn’t load a development chunk. Try a manual refresh.
          </p>
          {/* eslint-disable ds/min-tap-size -- CMS-1010 [ttl=2026-01-01] dev-only fallback control */}
          <button
            type="button"
            className="rounded bg-primary px-4 py-2 text-primary-foreground inline-flex items-center justify-center min-h-10 min-w-10"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
          {/* eslint-enable ds/min-tap-size -- CMS-1010 */}
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
