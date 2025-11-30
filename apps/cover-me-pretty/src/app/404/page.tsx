// apps/cover-me-pretty/src/app/404/page.tsx

import { type ReactElement } from "react";
import NotFoundContent from "../../components/NotFoundContent";

/**
 * Explicit App Router route for `/404` so the Pages Router isn’t involved.
 * Kept static and hook‑free for safe prerendering.
 */
export default function FourOhFourPage(): ReactElement {
  return <NotFoundContent />;
}

/** Force static generation just to make intent explicit. */
export const dynamic = "force-static";
