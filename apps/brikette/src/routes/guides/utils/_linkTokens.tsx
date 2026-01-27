import type { ReactNode } from "react";
import Link from "next/link";

import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideHref } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";

const TOKEN_PATTERN = /%([A-Z]+):([^|%]+)\|([^%]+)%/g;
const LEGACY_TOKEN_PATTERN = /\[\[link:([^|\]]+)\|([^\]]+)\]\]/gi;
const MUSTACHE_TOKEN_PATTERN = /\{\{guide:([^|}]+)\|([^}]+)\}\}/gi;

const ESCAPABLE = new Set(["\\", "`", "*", "~", "[", "]", "_", "#", "+", ">", ".", "-"]);
const BULLET_LINE = /^\s*\*\s+/u;

type TokenParseResult =
  | {
      kind: "link";
      href: string;
      label: string;
      endIndex: number;
    }
  | {
      kind: "externalLink";
      href: string;
      label: string;
      endIndex: number;
    }
  | {
      kind: "text";
      text: string;
      endIndex: number;
};

/**
 * Validates that a URL is safe for rendering as a link.
 * Only allows http, https, and mailto protocols.
 */
function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:")
  );
}

function normalizeTokenLabel(value: string): string {
  // Token labels come from translation content, but we still normalize whitespace
  // so accidental newlines/tabs don't produce surprising inline layout.
  return value.replace(/\s+/gu, " ").trim();
}

/**
 * Sanitize label for %LINK:key|label% token insertion.
 */
export function sanitizeLinkLabel(label: string): string {
  return label
    .replace(/%/gu, "")
    .replace(/\|/gu, "-")
    .replace(/\n/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, 100);
}

function isEscaped(text: string, index: number): boolean {
  // We only support backslash escapes for a limited set; treat \X as escaping X
  // only when X is in our escapable whitelist.
  if (index <= 0) return false;
  if (text[index - 1] !== "\\") return false;
  const current = text[index];
  return typeof current === "string" && ESCAPABLE.has(current);
}

function tryParsePercentToken(text: string, startIndex: number, lang: AppLanguage, howToBase: string): TokenParseResult | null {
  if (text[startIndex] !== "%") return null;
  // %TYPE:key|label%
  let i = startIndex + 1;
  let type = "";
  while (i < text.length) {
    const ch = text[i] ?? "";
    if (!/[A-Za-z]/u.test(ch)) break;
    type += ch;
    i += 1;
  }
  if (type.length === 0) return null;
  if (text[i] !== ":") return null;
  i += 1;

  const keyStart = i;
  while (i < text.length && text[i] !== "|" && text[i] !== "%") i += 1;
  if (i >= text.length || text[i] !== "|") return null;
  const rawKey = text.slice(keyStart, i);
  i += 1;

  const labelStart = i;
  while (i < text.length && text[i] !== "%") i += 1;
  if (i >= text.length || text[i] !== "%") return null;
  const rawLabel = text.slice(labelStart, i);
  const endIndex = i + 1;

  const tokenType = type.toUpperCase();
  const key = rawKey.trim();
  const label = normalizeTokenLabel(rawLabel);
  if (key.length === 0 || label.length === 0) return null;

  if (tokenType === "LINK") {
    const href = guideHref(lang, key as GuideKey);
    return { kind: "link", href, label, endIndex };
  }
  if (tokenType === "HOWTO") {
    if (howToBase.length === 0) return { kind: "text", text: label, endIndex };
    const href = `/${lang}/${howToBase}/${key}`;
    return { kind: "link", href, label, endIndex };
  }
  if (tokenType === "URL") {
    // External URL token: %URL:https://example.com|Label% or %URL:mailto:test@example.com|Email%
    // Only allow safe protocols (http, https, mailto)
    if (isSafeUrl(key)) {
      return { kind: "externalLink", href: key.trim(), label, endIndex };
    }
    // Unsafe URL: render as plain text for security
    return { kind: "text", text: label, endIndex };
  }

  // Unknown token types: fall back to the label.
  return { kind: "text", text: label, endIndex };
}

function tryParseLegacyToken(text: string, startIndex: number, lang: AppLanguage): TokenParseResult | null {
  // [[link:guideKey|Label]]
  if (text[startIndex] !== "[" || text[startIndex + 1] !== "[") return null;
  const prefix = "[[link:";
  if (!text.slice(startIndex, startIndex + prefix.length).toLowerCase().startsWith(prefix)) return null;
  let i = startIndex + prefix.length;
  const keyStart = i;
  while (i < text.length && text[i] !== "|" && text[i] !== "]") i += 1;
  if (i >= text.length || text[i] !== "|") return null;
  const rawKey = text.slice(keyStart, i);
  i += 1;
  const labelStart = i;
  while (i < text.length && !(text[i] === "]" && text[i + 1] === "]")) i += 1;
  if (i >= text.length) return null;
  const rawLabel = text.slice(labelStart, i);
  const endIndex = i + 2;

  const key = rawKey.trim();
  const label = normalizeTokenLabel(rawLabel);
  if (!key || !label) return null;
  const href = guideHref(lang, key as GuideKey);
  return { kind: "link", href, label, endIndex };
}

function tryParseMustacheToken(text: string, startIndex: number, lang: AppLanguage): TokenParseResult | null {
  // {{guide:guideKey|Label}}
  if (text[startIndex] !== "{" || text[startIndex + 1] !== "{") return null;
  const prefix = "{{guide:";
  if (!text.slice(startIndex, startIndex + prefix.length).toLowerCase().startsWith(prefix)) return null;
  let i = startIndex + prefix.length;
  const keyStart = i;
  while (i < text.length && text[i] !== "|" && text[i] !== "}") i += 1;
  if (i >= text.length || text[i] !== "|") return null;
  const rawKey = text.slice(keyStart, i);
  i += 1;
  const labelStart = i;
  while (i < text.length && !(text[i] === "}" && text[i + 1] === "}")) i += 1;
  if (i >= text.length) return null;
  const rawLabel = text.slice(labelStart, i);
  const endIndex = i + 2;

  const key = rawKey.trim();
  const label = normalizeTokenLabel(rawLabel);
  if (!key || !label) return null;
  const href = guideHref(lang, key as GuideKey);
  return { kind: "link", href, label, endIndex };
}

function renderInline(text: string, lang: AppLanguage, keyBase: string): ReactNode[] {
  const howToBase = getSlug("howToGetHere", lang);
  let linkIndex = 0;
  let elementIndex = 0;

  const nextElementKey = () => `${keyBase}-el-${elementIndex++}`;

  const parse = (startIndex: number, endDelim?: "***" | "**" | "*"): { endIndex: number; closed: boolean; children: ReactNode[] } => {
    const out: ReactNode[] = [];
    let i = startIndex;
    let localBuffer = "";

    const flushLocal = () => {
      if (localBuffer.length > 0) {
        out.push(localBuffer);
        localBuffer = "";
      }
    };

    const appendLinkLocal = (href: string, label: string, isExternal = false) => {
      flushLocal();
      const prev = out[out.length - 1];
      if (typeof prev === "string") {
        if (prev.length > 0 && !/\s$/u.test(prev)) out.push(" ");
      } else if (prev != null) {
        out.push(" ");
      }
      if (isExternal) {
        // External link: use native <a> with security attributes
        // mailto: links don't need target="_blank"
        const isMailto = href.toLowerCase().startsWith("mailto:");
        out.push(
          <a
            key={`${keyBase}-extlink-${linkIndex}`}
            href={href}
            {...(isMailto ? {} : { target: "_blank", rel: "noopener noreferrer" })}
          >
            {label}
          </a>,
        );
      } else {
        out.push(
          <Link key={`${keyBase}-link-${linkIndex}`} href={href}>
            {label}
          </Link>,
        );
      }
      linkIndex += 1;
    };

    while (i < text.length) {
      if (endDelim && text.startsWith(endDelim, i) && !isEscaped(text, i)) {
        flushLocal();
        return { endIndex: i + endDelim.length, closed: true, children: out };
      }

      const ch = text[i] ?? "";
      const next = text[i + 1] ?? "";

      if (ch === "\\" && next && ESCAPABLE.has(next)) {
        localBuffer += next;
        i += 2;
        continue;
      }

      if (ch === "%") {
        const parsed = tryParsePercentToken(text, i, lang, howToBase);
        if (parsed) {
          if (parsed.kind === "link") {
            appendLinkLocal(parsed.href, parsed.label);
          } else if (parsed.kind === "externalLink") {
            appendLinkLocal(parsed.href, parsed.label, true);
          } else if (parsed.kind === "text") {
            localBuffer += parsed.text;
          }
          i = parsed.endIndex;
          continue;
        }
      }

      if (ch === "[" && next === "[") {
        const parsed = tryParseLegacyToken(text, i, lang);
        if (parsed) {
          if (parsed.kind === "link") appendLinkLocal(parsed.href, parsed.label);
          else if (parsed.kind === "text") localBuffer += parsed.text;
          i = parsed.endIndex;
          continue;
        }
      }

      if (ch === "{" && next === "{") {
        const parsed = tryParseMustacheToken(text, i, lang);
        if (parsed) {
          if (parsed.kind === "link") appendLinkLocal(parsed.href, parsed.label);
          else if (parsed.kind === "text") localBuffer += parsed.text;
          i = parsed.endIndex;
          continue;
        }
      }

      // Markdown-lite emphasis parsing (well-nested only).
      if (ch === "*" && !isEscaped(text, i)) {
        // Prefer longest delimiter first so "***" doesn't get consumed as "**" + "*".
        const candidate = text.startsWith("***", i) ? "***" : text.startsWith("**", i) ? "**" : "*";
        const delimLen = candidate.length as 1 | 2 | 3;
        const delim = candidate as "***" | "**" | "*";
        const inner = parse(i + delimLen, delim);
        if (inner.closed && inner.children.length > 0) {
          flushLocal();
          if (delim === "***") {
            out.push(
              <strong key={nextElementKey()}>
                <em>{inner.children}</em>
              </strong>,
            );
          } else if (delim === "**") {
            out.push(<strong key={nextElementKey()}>{inner.children}</strong>);
          } else {
            out.push(<em key={nextElementKey()}>{inner.children}</em>);
          }
          i = inner.endIndex;
          continue;
        }
        // No closing delimiter (or empty span): treat marker as literal.
        localBuffer += delim;
        i += delimLen;
        continue;
      }

      localBuffer += ch;
      i += 1;
    }

    flushLocal();
    return { endIndex: i, closed: !endDelim, children: out };
  };

  // Top-level parse (no delimiter).
  const parsed = parse(0);

  // Merge adjacent strings that may have been split by recursive parsing.
  // (This keeps behavior closer to the legacy renderer and reduces ReactNode churn.)
  const merged: ReactNode[] = [];
  for (const node of parsed.children) {
    const prev = merged[merged.length - 1];
    if (typeof prev === "string" && typeof node === "string") {
      merged[merged.length - 1] = prev + node;
    } else {
      merged.push(node);
    }
  }
  return merged.length > 0 ? merged : (text ? [text] : []);
}

export function renderGuideLinkTokens(value: string | null | undefined, lang: AppLanguage, keyBase: string): ReactNode[] {
  const text = typeof value === "string" ? value : "";
  return renderInline(text, lang, keyBase);
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

export function renderBodyBlocks(blocks: readonly string[] | null | undefined, lang: AppLanguage, keyBase: string): ReactNode[] {
  const items = Array.isArray(blocks) ? blocks : [];
  const out: ReactNode[] = [];

  const renderList = (listItems: readonly string[], listKey: string) => (
    <ul key={listKey}>
      {listItems.map((item, index) => (
        <li key={`${listKey}-li-${index}`}>
          {renderGuideLinkTokens(item, lang, `${listKey}-li-${index}`)}
        </li>
      ))}
    </ul>
  );

  let i = 0;
  while (i < items.length) {
    const raw = items[i];
    const block = typeof raw === "string" ? raw : String(raw);

    // Multi-line list block stored in a single array entry.
    const lines = block.split("\n").map((line) => line.trimEnd());
    const nonEmpty = lines.filter((line) => line.trim().length > 0);
    const isListBlock = block.includes("\n") && nonEmpty.length > 0 && nonEmpty.every((line) => BULLET_LINE.test(line));
    if (isListBlock) {
      const listItems = nonEmpty.map((line) => line.replace(BULLET_LINE, "").trim()).filter((s) => s.length > 0);
      if (listItems.length > 0) {
        out.push(renderList(listItems, `${keyBase}-list-${i}`));
        i += 1;
        continue;
      }
    }

    // Legacy list stored as consecutive "* ..." array entries.
    if (BULLET_LINE.test(block)) {
      const start = i;
      const listItems: string[] = [];
      while (i < items.length) {
        const candidate = typeof items[i] === "string" ? (items[i] as string) : String(items[i]);
        if (!BULLET_LINE.test(candidate)) break;
        const stripped = candidate.replace(BULLET_LINE, "").trim();
        if (stripped.length > 0) listItems.push(stripped);
        i += 1;
      }
      if (listItems.length > 0) {
        out.push(renderList(listItems, `${keyBase}-list-${start}`));
        continue;
      }
      // Fall through if we somehow collected nothing meaningful.
      i = start;
    }

    out.push(
      <p key={`${keyBase}-p-${i}`}>
        {renderGuideLinkTokens(block, lang, `${keyBase}-p-${i}`)}
      </p>,
    );
    i += 1;
  }

  return out;
}

export function stripGuideMarkup(value: string | null | undefined): string {
  let text = stripGuideLinkTokens(value);

  // Strip list markers to make the JSON-LD text human-readable.
  text = text.replace(/(^|\n)\s*[*+-]\s+/gu, "$1");

  // Preserve escaped literal asterisks: if we unescape \* too early, we'll later strip '*'
  // when removing emphasis markers.
  const ESCAPED_ASTERISK = "\u0000";
  text = text.replace(/\\\*/gu, ESCAPED_ASTERISK);

  // Remove markdown-lite emphasis markers (after protecting escaped literal asterisks).
  text = text.replace(/\*\*\*/gu, "").replace(/\*\*/gu, "").replace(/\*/gu, "");

  // Unescape the subset we support so storage escapes don't leak into SEO.
  // NOTE: this intentionally excludes '*' since we handle that via ESCAPED_ASTERISK above.
  text = text.replace(/\\([\\`~\[\]_#+>.\-])/gu, "$1");
  text = text.replaceAll(ESCAPED_ASTERISK, "*");

  return text;
}
