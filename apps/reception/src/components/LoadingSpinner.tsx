"use client";

import { memo } from "react";

function LoadingSpinner() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-surface-2">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-border-2 border-t-primary-main" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading...
        </p>
      </div>
    </div>
  );
}

export default memo(LoadingSpinner);
