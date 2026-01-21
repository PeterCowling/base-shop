"use client";

import { memo } from "react";

import type { PageBuilderProps } from "./PageBuilder.types";
import PageBuilderLayout from "./PageBuilderLayout";
import usePageBuilderLayout from "./usePageBuilderLayout";

const PageBuilder = memo(function PageBuilder(props: PageBuilderProps) {
  const layoutProps = usePageBuilderLayout(props);
  return <PageBuilderLayout {...layoutProps} />;
});

export default PageBuilder;
