// apps/shop-bcd/src/components/NotFoundContent.tsx

import { memo, type ReactElement } from "react";

function NotFoundContentInner(): ReactElement {
  return (
    <div className="min-h-[100dvh] grid place-items-center p-16 text-center">
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold leading-tight">Page not found</h1>
        <p className="text-base opacity-80">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <a
          href="/"
          className="inline-block rounded-md border border-current px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Go to homepage
        </a>
      </div>
    </div>
  );
}

export default memo(NotFoundContentInner);
