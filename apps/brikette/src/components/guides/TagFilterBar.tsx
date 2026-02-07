// src/components/guides/TagFilterBar.tsx
import { memo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import clsx from "clsx";

import { useCurrentLanguage } from "@/hooks/useCurrentLanguage";
import { getSlug } from "@/utils/slug";

type TagFilter = {
  id: string;
  label: string;
};

type Props = {
  tags: TagFilter[];
  className?: string;
};

function TagFilterBar({ tags, className = "" }: Props): JSX.Element | null {
  const lang = useCurrentLanguage();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const params = new URLSearchParams(search);
  const selected = new Set(params.getAll("tag"));

  function toggle(tag: string): string {
    const next = new URLSearchParams(search);
    const list = new Set(next.getAll("tag"));
    if (list.has(tag)) list.delete(tag);
    else list.add(tag);
    next.delete("tag");
    for (const t of list) next.append("tag", t);
    const qs = next.toString();
    return `/${lang}/${getSlug("experiences", lang)}${qs ? `?${qs}` : ""}`;
  }

  if (!tags.length) return null;

  const containerClassName = clsx(
    "mb-6",
    "flex",
    "flex-wrap",
    "items-center",
    "gap-2",
    className
  );
  const base = clsx(
    "rounded-full",
    "border",
    "px-3",
    "py-1",
    "text-xs",
    "transition-colors"
  );
  const activeClasses = clsx(
    "border-brand-primary",
    "bg-brand-primary/10",
    "text-brand-primary",
    "dark:border-brand-primary/70",
    "dark:bg-brand-primary/20",
    "dark:text-brand-primary/80"
  );
  const inactiveClasses = clsx(
    "border-brand-outline/30",
    "text-brand-text/80",
    "hover:bg-brand-surface",
    "dark:border-brand-outline/60",
    "dark:text-brand-text",
    "dark:hover:bg-brand-surface/60"
  );

  return (
    <div className={containerClassName}>
      {tags.map(({ id, label }) => {
        const active = selected.has(id);
        return (
          <Link
            key={id}
            href={toggle(id)}
            className={clsx(base, active ? activeClasses : inactiveClasses)}
          >
            {active ? "✓ " : ""}#
            {label}
          </Link>
        );
      })}
    </div>
  );
}

export default memo(TagFilterBar);
