"use client";

import { RouteErrorFallback, type RouteErrorFallbackProps } from "../../components/error/RouteErrorFallback";

export default function Error(props: RouteErrorFallbackProps) {
  return <RouteErrorFallback {...props} routeName="document insert" />;
}
