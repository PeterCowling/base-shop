"use client";

import { memo } from "react";

import { Spinner } from "./common/Spinner";

function LoadingSpinner() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-surface-2">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" label="Loading page" />
        <p className="text-sm font-medium text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default memo(LoadingSpinner);
