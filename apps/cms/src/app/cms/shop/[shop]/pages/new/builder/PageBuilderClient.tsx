"use client";

import dynamic from "next/dynamic";
import type PageBuilderComponent from "@ui/components/cms/PageBuilder";

type PageBuilderProps = React.ComponentProps<typeof PageBuilderComponent>;

const PageBuilder = dynamic<PageBuilderProps>(
  () => import("@ui/components/cms/PageBuilder"),
  { ssr: false },
);

export default function PageBuilderClient(props: PageBuilderProps) {
  return <PageBuilder {...props} />;
}

