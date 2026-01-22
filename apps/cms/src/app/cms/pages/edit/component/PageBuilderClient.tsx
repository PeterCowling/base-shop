"use client";

import dynamic from "next/dynamic";

import type PageBuilderComponent from "@acme/cms-ui/PageBuilder";

type PageBuilderProps = React.ComponentProps<typeof PageBuilderComponent>;

const PageBuilder = dynamic<PageBuilderProps>(
  () => import("@acme/cms-ui/PageBuilder"),
  { ssr: false }
);

export default function PageBuilderClient(props: PageBuilderProps) {
  return <PageBuilder {...props} />;
}

