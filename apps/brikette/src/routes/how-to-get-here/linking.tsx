import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import clsx from "clsx";

import { isGuideLive } from "@/data/guides.index";
import type { LinkBinding, LinkTarget } from "@/lib/how-to-get-here/definitions";
import { guideHref, resolveGuideKeyFromSlug } from "@/routes.guides-helpers";

import type { LinkContext, RenderContext } from "./types";

export const LINK_CLASSNAME = clsx(
  "inline-flex",
  "min-h-11",
  "min-w-11",
  "items-center",
  "font-semibold",
  "text-brand-primary",
  "underline",
  "underline-offset-4",
  "transition-colors",
  "hover:no-underline",
  "focus-visible:outline",
  "focus-visible:outline-2",
  "focus-visible:outline-offset-2",
  "focus-visible:outline-brand-primary",
  "dark:text-brand-secondary",
);

export function resolveLinkTarget(
  target: LinkTarget,
  ctx: LinkContext,
): { type: "internal"; to: string } | { type: "external"; href: string } | null {
  switch (target.type) {
    case "external":
      return { type: "external", href: target.href };
    case "howToOverview":
      return { type: "internal", to: `/${ctx.lang}/${ctx.howToSlug}` };
    case "directions":
      return { type: "internal", to: `/${ctx.lang}/${ctx.howToSlug}/${target.slug}` };
    case "guide":
      if (!isGuideLive(target.guideKey)) {
        return null;
      }
      return { type: "internal", to: guideHref(ctx.lang, target.guideKey) };
    case "guidesSlug":
      {
        const key = resolveGuideKeyFromSlug(target.slug, ctx.lang);
        if (key) {
          if (!isGuideLive(key)) {
            return null;
          }
          return { type: "internal", to: guideHref(ctx.lang, key) };
        }
        return { type: "internal", to: `/${ctx.lang}/${ctx.guidesSlug}/${target.slug}` };
      }
    default:
      return { type: "external", href: "#" };
  }
}

export function renderLink(
  target: { type: "internal"; to: string } | { type: "external"; href: string } | null,
  children: ReactNode,
  key?: React.Key,
) {
  if (!target) {
    return <Fragment key={key}>{children}</Fragment>;
  }
  if (target.type === "internal") {
    return (
      <Link key={key} href={target.to} prefetch={true} className={LINK_CLASSNAME}>
        {children}
      </Link>
    );
  }
  return (
    <a key={key} href={target.href} target="_blank" rel="noopener noreferrer" className={LINK_CLASSNAME}>
      {children}
    </a>
  );
}

export function isLinkedCopy(value: unknown): value is {
  before?: string;
  linkLabel: string;
  after?: string;
} {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const { before, after, linkLabel } = record;
  if (typeof linkLabel !== "string" || !linkLabel.trim()) {
    return false;
  }
  if (before !== undefined && typeof before !== "string") {
    return false;
  }
  if (after !== undefined && typeof after !== "string") {
    return false;
  }
  return true;
}

export function renderLinkedCopy(
  value: { before?: string; linkLabel: string; after?: string },
  path: string,
  binding: LinkBinding | undefined,
  ctx: RenderContext,
  key: React.Key,
): ReactNode {
  const parts: ReactNode[] = [];
  if (value.before) {
    parts.push(
      <span key={`${key}-before`}>
        {renderRichText(value.before, path, binding, ctx)}
      </span>,
    );
  }

  if (value.linkLabel) {
    const linkTarget =
      binding?.linkObject ?? binding?.placeholders?.["link"] ?? binding?.placeholders?.["Link"];
    if (linkTarget) {
      const resolved = resolveLinkTarget(linkTarget, ctx.context);
      const linkKey = `${key}-link`;
      const children = renderRichText(value.linkLabel, `${path}.linkLabel`, binding, ctx);
      parts.push(renderLink(resolved, children, linkKey));
    } else {
      parts.push(
        <span key={`${key}-link`}>
          {value.linkLabel}
        </span>,
      );
    }
  }

  if (value.after) {
    parts.push(
      <span key={`${key}-after`}>
        {renderRichText(value.after, path, binding, ctx)}
      </span>,
    );
  }

  return <Fragment key={key}>{parts}</Fragment>;
}

export function renderRichText(
  value: string,
  path: string,
  binding: LinkBinding | undefined,
  ctx: RenderContext,
  depth = 0,
): ReactNode {
  if (!value.includes("<")) {
    return value;
  }
  const result: ReactNode[] = [];
  // eslint-disable-next-line security/detect-unsafe-regex -- TECH-000 placeholder parser for limited inline tags
  const regex = /<([A-Za-z0-9]+)(?:\s[^>]*)?>(.*?)<\/\1>/gs;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(value))) {
    if (match.index > lastIndex) {
      result.push(value.slice(lastIndex, match.index));
    }
    const placeholder = match[1];
    const inner = match[2] ?? "";
    if (!placeholder) {
      lastIndex = regex.lastIndex;
      continue;
    }
    const placeholderPath = `${path}.${placeholder}`;
    if (placeholder === "Strong") {
      result.push(
        <strong key={`${path}-${match.index}`}>{renderRichText(inner, placeholderPath, binding, ctx, depth + 1)}</strong>,
      );
    } else {
      const placeholderTarget =
        binding?.placeholders?.[placeholder as keyof typeof binding.placeholders];
      if (placeholderTarget) {
        const resolved = resolveLinkTarget(placeholderTarget, ctx.context);
        const children = renderRichText(inner, placeholderPath, binding, ctx, depth + 1);
        result.push(renderLink(resolved, children, `${path}-${match.index}`));
      } else {
        result.push(inner);
      }
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < value.length) {
    result.push(value.slice(lastIndex));
  }
  return depth === 0 && result.length === 1 ? result[0] : <Fragment key={path}>{result}</Fragment>;
}
