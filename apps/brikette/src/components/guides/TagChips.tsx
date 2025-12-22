// src/components/guides/TagChips.tsx
import { memo, useContext } from "react";
import { Link, useInRouterContext } from "react-router-dom";
import { UNSAFE_DataRouterStateContext } from "react-router";
import clsx from "clsx";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { getSlug } from "@/utils/slug";

const WRAPPER_CLASSES = ["mt-6", "flex", "flex-wrap", "items-center", "gap-2"] as const;

const CHIP_CLASSES = [
  "inline-flex",
  "items-center",
  "gap-1",
  "rounded-full",
  "border",
  "border-brand-outline/40",
  "px-3",
  "py-1",
  "text-xs",
  "font-medium",
  "text-brand-muted",
  "transition",
  "hover:bg-brand-surface/60",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-brand-primary/60",
  "dark:border-brand-outline/50",
  "dark:text-brand-muted-dark",
  "dark:hover:bg-brand-text/10",
] as const;

const CHIP_PREFIX_CLASSES = [
  "text-brand-muted",
  "dark:text-brand-muted-dark",
] as const;

type Props = {
  tags?: string[];
  className?: string;
};

function TagChips({ tags, className = "" }: Props): JSX.Element | null {
  const lang = useCurrentLanguage();
  // Some tests render this component without a Data Router or with a different
  // router package instance. Read router state via context (safe outside a
  // Router) instead of calling hooks conditionally.
  const routerState = useContext(UNSAFE_DataRouterStateContext);
  const inRouter = useInRouterContext();
  type Handle = { tags?: string[] };
  const matches = routerState?.matches as
    | Array<{ route?: { handle?: Handle } }>
    | undefined;
  const fromHandle: string[] | undefined = matches?.length
    ? matches[matches.length - 1]?.route?.handle?.tags
    : undefined;
  const list = tags ?? fromHandle ?? [];

  if (!list.length) return null;

  return (
    <div className={clsx(WRAPPER_CLASSES, className)}>
      {list.map((tag) => {
        const path = `/${lang}/${getSlug("guides", lang)}/tags/${encodeURIComponent(tag)}`;
        const content = (
          <>
            <span className="sr-only">{`#${tag}`}</span>
            <span aria-hidden="true" className={clsx(CHIP_PREFIX_CLASSES)}>
              #
            </span>
            <span aria-hidden="true">{tag}</span>
          </>
        );
        if (!routerState || !inRouter) {
          return (
            <a key={tag} href={path} className={clsx(CHIP_CLASSES)}>
              {content}
            </a>
          );
        }

        return (
          <Link key={tag} to={path} className={clsx(CHIP_CLASSES)}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}

export default memo(TagChips);
