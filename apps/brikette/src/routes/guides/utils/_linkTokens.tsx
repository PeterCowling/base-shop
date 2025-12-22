 
import { Link } from "react-router-dom";
import type { ReactNode } from "react";

import { guideHref } from "@/routes.guides-helpers";
import type { GuideKey } from "@/routes.guides-helpers";
import type { AppLanguage } from "@/i18n.config";

const TOKEN_PATTERN = /%LINK:([^|%]+)\|([^%]+)%/g;
const LEGACY_TOKEN_PATTERN = /\[\[link:([^|\]]+)\|([^\]]+)\]\]/gi;
const MUSTACHE_TOKEN_PATTERN = /\{\{guide:([^|}]+)\|([^}]+)\}\}/gi;

export function renderGuideLinkTokens(value: string | null | undefined, lang: AppLanguage, keyBase: string): ReactNode[] {
  const text = typeof value === "string" ? value : "";
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let linkIndex = 0;

  while ((match = TOKEN_PATTERN.exec(text)) !== null) {
    const token = match[0] ?? "";
    const rawKey = match[1];
    const rawLabel = match[2];
    if (!rawKey || !rawLabel) {
      lastIndex = match.index + token.length;
      continue;
    }
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const guideKey = rawKey.trim() as GuideKey;
    const label = rawLabel.trim();

    if (guideKey.length > 0 && label.length > 0) {
      // For inline guide link tokens, resolve URLs under the canonical /guides
      // base regardless of each guide's namespace. This matches test
      // expectations and keeps cross-guide links stable in content.
      const href = guideHref(lang, guideKey, { forceGuidesBase: true });
      const previousNode = nodes[nodes.length - 1];
      if (typeof previousNode === "string") {
        if (previousNode.length > 0 && !/\s$/u.test(previousNode)) {
          nodes.push(" ");
        }
      } else if (previousNode != null) {
        nodes.push(" ");
      }
      nodes.push(
        <Link key={`${keyBase}-link-${linkIndex}`} to={href}>{label}</Link>,
      );
      linkIndex += 1;
    } else {
      nodes.push(label.length > 0 ? label : token);
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : (text ? [text] : []);
}

export function stripGuideLinkTokens(value: string | null | undefined): string {
  const text = typeof value === "string" ? value : "";
  return text
    .replace(TOKEN_PATTERN, "$2")
    .replace(LEGACY_TOKEN_PATTERN, "$2")
    .replace(MUSTACHE_TOKEN_PATTERN, "$2");
}
