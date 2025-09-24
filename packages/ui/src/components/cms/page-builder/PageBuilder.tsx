"use client";

import { memo } from "react";
import PageBuilderLayout from "./PageBuilderLayout";
import usePageBuilderLayout from "./usePageBuilderLayout";
import type { PageBuilderProps } from "./PageBuilder.types";

const PageBuilder = memo(function PageBuilder(props: PageBuilderProps) {
  const layoutProps = usePageBuilderLayout(props);
  return <PageBuilderLayout {...layoutProps} />;
});

export default PageBuilder;
