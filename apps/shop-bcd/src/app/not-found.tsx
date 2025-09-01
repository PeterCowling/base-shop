// apps/shop-bcd/src/app/not-found.tsx

import { type ReactElement } from "react";
import NotFoundClient from "./not-found.client";

/**
 * Server component wrapper for the application router’s not‑found page.
 *
 * Next.js requires not‑found pages under the `app/` directory to be
 * server components.  However, any hooks or client‑side logic must be
 * isolated to a client component.  By delegating rendering to
 * {@link NotFoundClient}, this file satisfies that requirement while still
 * returning a valid React element to Next.js.
 */
export default function NotFound(): ReactElement {
  return <NotFoundClient />;
}
