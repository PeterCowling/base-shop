// apps/shop-bcd/src/app/not-found.tsx

import { type ReactElement } from "react";
import NotFoundContent from "../components/NotFoundContent";

/**
 * Server component wrapper for the application router’s not‑found page.
 *
 * Next.js requires not‑found pages under the `app/` directory to be
 * server components.  By delegating rendering to {@link NotFoundContent},
 * this file satisfies that requirement while still returning a valid
 * React element to Next.js.
 */
export default function NotFound(): ReactElement {
  // Render a static not‑found page.  Avoid client‑side hooks here
  // because the app router treats this file as a server component.
  return <NotFoundContent />;
}
