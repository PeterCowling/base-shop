import { type ReactElement } from "react";

import CmsNotFound from "./not-found.client";

/**
 * NotFound renders the CMS dashboard 404 page.
 * Returning a bare component causes Next.js build failures, so this wrapper
 * ensures Next.js receives a valid React element.
 */
export default function NotFound(): ReactElement {
  return <CmsNotFound />;
}
