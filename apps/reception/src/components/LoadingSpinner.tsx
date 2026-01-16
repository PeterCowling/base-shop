"use client";

import { memo } from "react";

function LoadingSpinner() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-gray-100 dark:bg-darkBg">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-primary-600 dark:border-darkBorder dark:border-t-darkAccentGreen" />
        <p className="text-sm font-medium text-gray-600 dark:text-darkAccentGreen">
          Loading...
        </p>
      </div>
    </div>
  );
}

export default memo(LoadingSpinner);
