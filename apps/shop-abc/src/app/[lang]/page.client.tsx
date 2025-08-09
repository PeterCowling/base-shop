// apps/shop-abc/src/app/[[...lang]]/page.tsx
"use client";

import { DynamicRenderer } from "@ui";
import type { PageComponent } from "@types";

export default function Home({
  components,
}: {
  components: PageComponent[];
}) {
  return <DynamicRenderer components={components} />;
}
