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
        <div className="mx-auto max-w-lg p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            We couldn’t load a development chunk. Try a manual refresh.
          </p>
          <button
            type="button"
            className="rounded bg-primary px-4 py-2 text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Refresh
          </button>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
