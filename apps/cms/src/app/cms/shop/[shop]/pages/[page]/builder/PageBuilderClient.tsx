"use client";

import dynamic from "next/dynamic";
import type { PageBuilderProps } from "@acme/page-builder-ui";

const PageBuilder = dynamic<PageBuilderProps>(
  () => import("@acme/page-builder-ui").then((mod) => mod.PageBuilder),
  { ssr: false },
);

export default function PageBuilderClient(props: PageBuilderProps) {
  return <PageBuilder {...props} />;
}
