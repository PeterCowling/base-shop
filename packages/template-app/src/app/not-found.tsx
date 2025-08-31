// packages/template-app/src/app/not-found.tsx
"use client";

import { Error404Template } from "@ui/components/templates/Error404Template";
import { type ReactElement } from "react";

/**
 * NotFound renders the store‑wide 404 page.  It delegates all UI
 * and routing behaviour to Error404Template.
 */
export default function NotFound(): ReactElement {
  // Return the template as a JSX element; without this the
  // function returns `void`, which causes Next.js to throw.
  return <Error404Template />;
}
