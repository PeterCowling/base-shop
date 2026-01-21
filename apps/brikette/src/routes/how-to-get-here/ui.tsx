import clsx from "clsx";

import type { InlineListProps } from "./types";

export { Cluster, Inline, InlineItem,Stack } from "@/components/ui/flex";

export const InlineList = ({ className, ...props }: InlineListProps) => (
  <ul className={clsx("flex", "flex-wrap", "gap-3", className)} {...props} />
);
