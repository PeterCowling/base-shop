// apps/shop-bcd/src/components/NotFoundContent.tsx

import { memo, type ReactElement } from "react";

/**
 * Shared 404/Not Found markup used in both the application and pages
 * routers.  It renders a simple message and a link back to the home
 * page.  Because this component has no dependencies on client‑side
 * hooks or external data, it can be rendered on either the server or the
 * client without modification.  Wrapping it in `memo` prevents
 * unnecessary re‑renders when used within other components.
 */
function NotFoundContentInner(): ReactElement {
  return (
    <div className="grid min-h-[100dvh] place-items-center p-16 text-center">
      <div className="space-y-6">
        <h1 className="text-3xl leading-tight font-semibold">Page not found</h1>
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

const NotFoundContent = memo(NotFoundContentInner);
export default NotFoundContent;
