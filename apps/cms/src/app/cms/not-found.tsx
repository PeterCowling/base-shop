import { type ReactElement } from "react";
import CmsNotFound from "./not-found.client";

/**
 * NotFound renders the CMS dashboard 404 page.  It wraps the client‑side
 * `CmsNotFound` component and ensures Next.js receives a valid React element.
 */
export default function NotFound(): ReactElement {
  return <CmsNotFound />;
}
