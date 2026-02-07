import { Fragment, type ReactNode } from "react";
import Link from "next/link";

import { LinkText } from "@acme/design-system/atoms";

import { isGuidePublished } from "@/data/guides.index";
import { guideHref, type GuideKey } from "@/routes.guides-helpers";
import type { GuideSeoTemplateContext } from "@/routes/guides/_GuideSeoTemplate";

const inlineLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;

export const GUIDE_SCHEME_PREFIX = "guide:" as const;

/** Shared Tailwind classes for inline links in how-to-get-here article leads */
export const INLINE_LINK_CLASSES =
  "align-middle font-medium text-brand-primary underline-offset-4 hover:underline dark:text-brand-secondary" as const;

/**
 * Parse markdown-style inline links in a string and return React nodes.
 * Supports:
 *  - `guide:someKey` scheme → internal guide link
 *  - `/path` → internal Next.js link
 *  - External URLs → `<a>` with target="_blank"
 */
export function renderInlineLinks(
  value: string,
  keyPrefix: string,
  context: GuideSeoTemplateContext,
): ReactNode {
  inlineLinkPattern.lastIndex = 0;
  let match: RegExpExecArray | null;
  let lastIndex = 0;
  const parts: ReactNode[] = [];

  while ((match = inlineLinkPattern.exec(value))) {
    if (match.index > lastIndex) {
      const textSegment = value.slice(lastIndex, match.index);
      if (textSegment) {
        parts.push(<Fragment key={`${keyPrefix}-text-${match.index}`}>{textSegment}</Fragment>);
      }
    }

    const labelRaw = match[1];
    const hrefRaw = match[2];
    if (!labelRaw || !hrefRaw) {
      lastIndex = inlineLinkPattern.lastIndex;
      continue;
    }
    const label = labelRaw.trim();
    const href = hrefRaw.trim();
    const key = `${keyPrefix}-link-${match.index}`;

    if (href.startsWith(GUIDE_SCHEME_PREFIX)) {
      const guideKey = href.slice(GUIDE_SCHEME_PREFIX.length).trim();
      if (guideKey.length > 0) {
        if (isGuidePublished(guideKey as GuideKey)) {
          parts.push(
            <LinkText asChild key={key} className={INLINE_LINK_CLASSES}>
              <Link href={guideHref(context.lang, guideKey as GuideKey)} prefetch={true}>
                {label}
              </Link>
            </LinkText>,
          );
        } else {
          parts.push(
            <Fragment key={key}>
              {label}
            </Fragment>,
          );
        }
      } else {
        parts.push(
          <Fragment key={key}>
            {label}
          </Fragment>,
        );
      }
    } else if (href.startsWith("/")) {
      parts.push(
        <LinkText asChild key={key} className={INLINE_LINK_CLASSES}>
          <Link href={href} prefetch={true}>
            {label}
          </Link>
        </LinkText>,
      );
    } else {
      parts.push(
        <LinkText asChild key={key} className={INLINE_LINK_CLASSES}>
          <a href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        </LinkText>,
      );
    }

    lastIndex = inlineLinkPattern.lastIndex;
  }

  if (lastIndex < value.length) {
    const textSegment = value.slice(lastIndex);
    if (textSegment) {
      parts.push(<Fragment key={`${keyPrefix}-text-${lastIndex}`}>{textSegment}</Fragment>);
    }
  }

  return parts.length > 0 ? parts : value;
}
