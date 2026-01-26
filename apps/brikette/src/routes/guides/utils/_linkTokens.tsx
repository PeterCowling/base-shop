import type { ReactNode } from "react";
import Link from "next/link";

import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideHref } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";

const TOKEN_PATTERN = /%([A-Z]+):([^|%]+)\|([^%]+)%/g;
const LEGACY_TOKEN_PATTERN = /\[\[link:([^|\]]+)\|([^\]]+)\]\]/gi;
const MUSTACHE_TOKEN_PATTERN = /\{\{guide:([^|}]+)\|([^}]+)\}\}/gi;

export function renderGuideLinkTokens(value: string | null | undefined, lang: AppLanguage, keyBase: string): ReactNode[] {
  const text = typeof value === "string" ? value : "";
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let linkIndex = 0;
  const howToBase = getSlug("howToGetHere", lang);
  TOKEN_PATTERN.lastIndex = 0;

  const appendLink = (href: string, label: string) => {
    const previousNode = nodes[nodes.length - 1];
    if (typeof previousNode === "string") {
      if (previousNode.length > 0 && !/\s$/u.test(previousNode)) {
        nodes.push(" ");
      }
    } else if (previousNode != null) {
      nodes.push(" ");
    }
    nodes.push(<Link key={`${keyBase}-link-${linkIndex}`} href={href}>{label}</Link>);
    linkIndex += 1;
  };

  while ((match = TOKEN_PATTERN.exec(text)) !== null) {
    const token = match[0] ?? "";
    const tokenType = (match[1] ?? "").toUpperCase();
    const rawKey = match[2];
    const rawLabel = match[3];
    if (!rawKey || !rawLabel) {
      lastIndex = match.index + token.length;
      continue;
    }
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const label = rawLabel.trim();

    if (tokenType === "LINK") {
      const guideKey = rawKey.trim() as GuideKey;
      if (guideKey.length > 0 && label.length > 0) {
        const href = guideHref(lang, guideKey);
        appendLink(href, label);
        lastIndex = match.index + token.length;
        continue;
      }
    } else if (tokenType === "HOWTO") {
      const slug = rawKey.trim();
      if (slug.length > 0 && howToBase.length > 0 && label.length > 0) {
        const href = `/${lang}/${howToBase}/${slug}`;
        appendLink(href, label);
        lastIndex = match.index + token.length;
        continue;
      }
    }

    nodes.push(label.length > 0 ? label : token);
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : (text ? [text] : []);
}

export function stripGuideLinkTokens(value: string | null | undefined): string {
  const text = typeof value === "string" ? value : "";
  TOKEN_PATTERN.lastIndex = 0;
  LEGACY_TOKEN_PATTERN.lastIndex = 0;
  MUSTACHE_TOKEN_PATTERN.lastIndex = 0;
  return text
    .replace(TOKEN_PATTERN, "$3")
    .replace(LEGACY_TOKEN_PATTERN, "$2")
    .replace(MUSTACHE_TOKEN_PATTERN, "$2");
}
