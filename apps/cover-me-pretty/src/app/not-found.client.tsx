// apps/cover-me-pretty/src/app/not-found.client.tsx

"use client";

import Link from "next/link";
import { memo, useMemo, type ReactElement } from "react";
import { useTranslations } from "@i18n/Translations";
// Pull the NotFoundMessages interface from our central types to ensure
// consistent shape across server and client.  Even though this component
// currently hard‑codes its copy, having the type ready makes it
// straightforward to introduce translations later.
import type { NotFoundMessages } from "../types/not-found";

/**
 * Presentational component that renders a simple 404/Not Found message.
 *
 * This component lives in the client boundary so it may freely use hooks
 * such as `useMemo` and wrap other client‑only primitives.  It does not
 * perform any side effects or maintain state, so it remains highly
 * predictable.  The use of `memo` prevents unnecessary re‑rendering
 * when consumed by its server wrapper.
 */
function NotFoundClientInner(): ReactElement {
  const t = useTranslations();
  // Memoise the messages to avoid recreating the object on every render.
  // Should translations be introduced, this memo would depend on the
  // translation function (e.g. `t`) so messages update accordingly.
  const messages: NotFoundMessages = useMemo(
    () => ({
      // i18n keys intentionally mirror English copy for now; when
      // localized strings are added, these keys become stable IDs.
      title: String(t("Page not found")),
      description: String(
        t("The page you're looking for doesn't exist or has moved.")
      ),
      cta: String(t("Go to homepage")),
    }),
    [t]
  );

  return (
    // Utility classes from TailwindCSS keep the markup lean and semantic.
    // A responsive grid centres the content both vertically and
    // horizontally.  We avoid inline styles to let the design system
    // control spacing and typography globally.
    <div className="grid page-min-h-screen-safe place-items-center p-16 text-center">
      <div className="space-y-6">
        <h1 className="text-3xl leading-tight font-semibold">
          {messages.title}
        </h1>
        <p className="text-base opacity-80">{messages.description}</p>
        <Link
          href="/"
          className="inline-block rounded-md border border-current px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 min-h-10 min-w-10"
        >
          {messages.cta}
        </Link>
      </div>
    </div>
  );
}

// Wrap the component with React.memo to prevent re‑rendering when its
// props remain unchanged.  Because this component has no props, it will
// never re‑render after the first mount.
const NotFoundClient = memo(NotFoundClientInner);

export default NotFoundClient;
