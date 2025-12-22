import clsx from "clsx";

import type { InlineListProps } from "./types";

export { Stack, Inline, Cluster, InlineItem } from "@/components/ui/flex";

export const InlineList = ({ className, ...props }: InlineListProps) => (
  <ul className={clsx("flex", "flex-wrap", "gap-3", className)} {...props} />
);
