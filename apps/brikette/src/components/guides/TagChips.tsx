// src/components/guides/TagChips.tsx
import { memo } from "react";
import Link from "next/link";
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
  const list = tags ?? [];

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

        return (
          <Link key={tag} href={path} className={clsx(CHIP_CLASSES)}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}

export default memo(TagChips);
