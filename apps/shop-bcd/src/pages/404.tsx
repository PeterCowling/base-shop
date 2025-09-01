// apps/shop-bcd/src/pages/404.tsx

import { type ReactElement } from "react";
import NotFoundContent from "../components/NotFoundContent";

/**
 * Pages router 404 page wrapper.
 *
 * Even though the Pages router runs entirely on the client, we wrap
 * the underlying presentational component to preserve a single source of
 * truth for the 404 UI.  This allows both the `app/` and `pages/`
 * directories to display the same content without duplicating markup.
 */
export default function NotFoundPage(): ReactElement {
  // Render the shared static not‑found content.  No client‑side hooks are
  // used here, which allows the page to be prerendered at build time.
  return <NotFoundContent />;
}
