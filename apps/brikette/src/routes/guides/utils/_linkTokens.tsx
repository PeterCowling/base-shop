import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { isGuideLive } from "@/data/guides.index";
import type { AppLanguage } from "@/i18n.config";
import type { GuideKey } from "@/routes.guides-helpers";
import { guideHref, resolveGuideKeyFromSlug } from "@/routes.guides-helpers";
import { getSlug } from "@/utils/slug";

const TOKEN_PATTERN = /%([A-Z]+):([^|%]+)\|([^%]+)%/g;
const LEGACY_TOKEN_PATTERN = /\[\[link:([^|\]]+)\|([^\]]+)\]\]/gi;
const MUSTACHE_TOKEN_PATTERN = /\{\{guide:([^|}]+)\|([^}]+)\}\}/gi;

const ESCAPABLE = new Set(["\\", "`", "*", "~", "[", "]", "_", "#", "+", ">", ".", "-"]);
const BULLET_LINE = /^\s*\*\s+/u;
const EXTERNAL_REL_PARTS = ["noopener", "noreferrer"] as const;
const EXTERNAL_REL = EXTERNAL_REL_PARTS.join(" ");
const INLINE_LINK_CLASS =
  "inline-flex min-h-11 min-w-11 items-center font-medium text-primary-700 underline decoration-primary-300 underline-offset-2 transition-colors hover:text-primary-900 hover:decoration-primary-500 dark:text-primary-400 dark:decoration-primary-600 dark:hover:text-primary-300 dark:hover:decoration-primary-400";

type EmphasisDelimiter = "***" | "**" | "*";
type ParseResult = { endIndex: number; closed: boolean; children: ReactNode[] };
type PercentTokenHeader = { tokenType: string; indexAfterColon: number };
type PercentTokenPayload = { key: string; label: string; endIndex: number };
type PercentTokenContext = {
  lang: AppLanguage;
  howToBase: string;
  guideKey?: string;
};

const LEGACY_HOWTO_TOKEN_ALIASES: Readonly<Record<string, GuideKey>> = Object.freeze({
  "positano-naples-ferry": "positanoToNaplesDirectionsByFerry",
});

/**
 * Convert camelCase to kebab-case for guide folder names.
 * Example: positanoPompeii → positano-pompeii
 */
function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

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
      kind: "image";
      src: string;
      alt: string;
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

function parsePercentTokenHeader(text: string, startIndex: number): PercentTokenHeader | null {
  if (text[startIndex] !== "%") return null;
  let i = startIndex + 1;
  let type = "";
  while (i < text.length) {
    const ch = text[i] ?? "";
    if (!/[A-Za-z]/u.test(ch)) break;
    type += ch;
    i += 1;
  }
  if (type.length === 0 || text[i] !== ":") return null;
  return { tokenType: type.toUpperCase(), indexAfterColon: i + 1 };
}

function parsePercentTokenPayload(
  text: string,
  startIndex: number,
  tokenType: string,
): PercentTokenPayload | null {
  let i = startIndex;
  const keyStart = i;
  const allowPercentInKey = tokenType === "URL";
  while (i < text.length && text[i] !== "|") {
    if (!allowPercentInKey && text[i] === "%") break;
    i += 1;
  }
  if (i >= text.length || text[i] !== "|") return null;
  const rawKey = text.slice(keyStart, i);
  i += 1;

  const labelStart = i;
  while (i < text.length && text[i] !== "%") i += 1;
  if (i >= text.length || text[i] !== "%") return null;

  const key = rawKey.trim();
  const label = normalizeTokenLabel(text.slice(labelStart, i));
  if (!key || !label) return null;
  return { key, label, endIndex: i + 1 };
}

function toGuideLinkOrText(key: string, label: string, lang: AppLanguage, endIndex: number): TokenParseResult {
  if (!isGuideLive(key as GuideKey)) {
    return { kind: "text", text: label, endIndex };
  }
  return { kind: "link", href: guideHref(lang, key as GuideKey), label, endIndex };
}

function toLowerTrimmed(value: string): string {
  return value.trim().toLowerCase();
}

function isHowToOverviewToken(rawKey: string, howToBase: string): boolean {
  const normalized = toLowerTrimmed(rawKey);
  if (!normalized) return false;
  return (
    normalized === "how-to-get-here" ||
    normalized === "howtogethere" ||
    normalized === howToBase.toLowerCase()
  );
}

function toCamelCaseToken(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "";
  if (!/[-_\s]/u.test(normalized)) return normalized;

  const parts = normalized
    .split(/[-_\s]+/u)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "";
  return parts
    .map((part, index) =>
      index === 0
        ? `${part.charAt(0).toLowerCase()}${part.slice(1)}`
        : `${part.charAt(0).toUpperCase()}${part.slice(1)}`,
    )
    .join("");
}

function resolveHowToGuideKey(rawKey: string, lang: AppLanguage): GuideKey | null {
  const normalized = rawKey.trim();
  if (!normalized) return null;

  if (isGuideLive(normalized as GuideKey)) {
    return normalized as GuideKey;
  }

  const resolvedFromSlug = resolveGuideKeyFromSlug(normalized, lang);
  if (resolvedFromSlug && isGuideLive(resolvedFromSlug)) {
    return resolvedFromSlug;
  }

  const alias = LEGACY_HOWTO_TOKEN_ALIASES[toLowerTrimmed(normalized)];
  if (alias && isGuideLive(alias)) {
    return alias;
  }

  const camelCandidate = toCamelCaseToken(normalized);
  if (camelCandidate && isGuideLive(camelCandidate as GuideKey)) {
    return camelCandidate as GuideKey;
  }

  const resolvedFromCamel = camelCandidate
    ? resolveGuideKeyFromSlug(camelCandidate, lang)
    : undefined;
  if (resolvedFromCamel && isGuideLive(resolvedFromCamel)) {
    return resolvedFromCamel;
  }

  return null;
}

function buildPercentTokenResult(
  tokenType: string,
  key: string,
  label: string,
  endIndex: number,
  context: PercentTokenContext,
): TokenParseResult {
  const { lang, howToBase, guideKey } = context;
  if (tokenType === "LINK") {
    return toGuideLinkOrText(key, label, lang, endIndex);
  }

  if (tokenType === "HOWTO") {
    if (howToBase.length === 0) return { kind: "text", text: label, endIndex };
    if (isHowToOverviewToken(key, howToBase)) {
      return { kind: "link", href: `/${lang}/${howToBase}`, label, endIndex };
    }

    const resolvedGuideKey = resolveHowToGuideKey(key, lang);
    if (!resolvedGuideKey) {
      return { kind: "text", text: label, endIndex };
    }
    return { kind: "link", href: guideHref(lang, resolvedGuideKey), label, endIndex };
  }

  if (tokenType === "URL") {
    return isSafeUrl(key)
      ? { kind: "externalLink", href: key.trim(), label, endIndex }
      : { kind: "text", text: label, endIndex };
  }

  if (tokenType === "IMAGE") {
    let src = key.trim();
    if (!src.startsWith("/") && guideKey) {
      src = `/img/guides/${toKebabCase(guideKey)}/${src}`;
    }
    return { kind: "image", src, alt: label, endIndex };
  }

  return { kind: "text", text: label, endIndex };
}

function tryParsePercentToken(
  text: string,
  startIndex: number,
  lang: AppLanguage,
  howToBase: string,
  guideKey?: string,
): TokenParseResult | null {
  const header = parsePercentTokenHeader(text, startIndex);
  if (!header) return null;
  const payload = parsePercentTokenPayload(text, header.indexAfterColon, header.tokenType);
  if (!payload) return null;
  return buildPercentTokenResult(
    header.tokenType,
    payload.key,
    payload.label,
    payload.endIndex,
    { lang, howToBase, guideKey },
  );
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
  if (!isGuideLive(key as GuideKey)) {
    return { kind: "text", text: label, endIndex };
  }
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
  if (!isGuideLive(key as GuideKey)) {
    return { kind: "text", text: label, endIndex };
  }
  const href = guideHref(lang, key as GuideKey);
  return { kind: "link", href, label, endIndex };
}

function parseDelimitedToken(text: string, index: number, lang: AppLanguage, howToBase: string, guideKey?: string): TokenParseResult | null {
  const ch = text[index];
  const next = text[index + 1];
  if (ch === "%") return tryParsePercentToken(text, index, lang, howToBase, guideKey);
  if (ch === "[" && next === "[") return tryParseLegacyToken(text, index, lang);
  if (ch === "{" && next === "{") return tryParseMustacheToken(text, index, lang);
  return null;
}

function renderEmphasisNode(delim: EmphasisDelimiter, key: string, children: ReactNode[]): ReactNode {
  if (delim === "***") {
    return (
      <strong key={key}>
        <em>{children}</em>
      </strong>
    );
  }
  if (delim === "**") return <strong key={key}>{children}</strong>;
  return <em key={key}>{children}</em>;
}

function parseEmphasisDelimiter(text: string, index: number): { delim: EmphasisDelimiter; length: number } {
  if (text.startsWith("***", index)) return { delim: "***", length: 3 };
  if (text.startsWith("**", index)) return { delim: "**", length: 2 };
  return { delim: "*", length: 1 };
}

function renderInline(text: string, lang: AppLanguage, keyBase: string, guideKey?: string): ReactNode[] {
  const howToBase = getSlug("howToGetHere", lang);
  let linkIndex = 0;
  let elementIndex = 0;

  const nextElementKey = () => `${keyBase}-el-${elementIndex++}`;

  const parse = (startIndex: number, endDelim?: EmphasisDelimiter): ParseResult => {
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
            className={INLINE_LINK_CLASS}
            {...(isMailto ? {} : { target: "_blank", rel: EXTERNAL_REL })}
          >
            {label}
          </a>,
        );
      } else {
        out.push(
          <Link
            key={`${keyBase}-link-${linkIndex}`}
            href={href}
            className={INLINE_LINK_CLASS}
          >
            {label}
          </Link>,
        );
      }
      linkIndex += 1;
    };

    const appendParsedTokenText = (tokenText: string) => {
      if (localBuffer.length > 0 && !/\s$/u.test(localBuffer) && !/^\s/u.test(tokenText)) {
        localBuffer += " ";
      }
      localBuffer += tokenText;
    };

    const appendParsedTokenNode = (
      parsed: Extract<TokenParseResult, { kind: "link" | "externalLink" | "image" }>,
    ) => {
      flushLocal();
      if (parsed.kind === "link") {
        appendLinkLocal(parsed.href, parsed.label);
        return;
      }
      if (parsed.kind === "externalLink") {
        appendLinkLocal(parsed.href, parsed.label, true);
        return;
      }
      out.push(
        <Image
          key={`${keyBase}-img-${linkIndex++}`}
          src={parsed.src}
          alt={parsed.alt}
          width={1200}
          height={900}
          className="my-6 h-auto w-full rounded-lg"
          data-aspect="4/3"
          loading="lazy"
        />,
      );
    };

    const tryConsumeEscapedCharacter = (ch: string, next: string): boolean => {
      if (ch !== "\\" || !next || !ESCAPABLE.has(next)) {
        return false;
      }
      localBuffer += next;
      i += 2;
      return true;
    };

    const tryConsumeDelimitedToken = (): boolean => {
      const parsed = parseDelimitedToken(text, i, lang, howToBase, guideKey);
      if (!parsed) {
        return false;
      }
      if (parsed.kind === "text") {
        appendParsedTokenText(parsed.text);
      } else {
        appendParsedTokenNode(parsed);
      }
      i = parsed.endIndex;
      return true;
    };

    const tryConsumeEmphasis = (ch: string): boolean => {
      if (ch !== "*" || isEscaped(text, i)) {
        return false;
      }
      const { delim, length } = parseEmphasisDelimiter(text, i);
      const inner = parse(i + length, delim);
      if (inner.closed && inner.children.length > 0) {
        flushLocal();
        out.push(renderEmphasisNode(delim, nextElementKey(), inner.children));
        i = inner.endIndex;
        return true;
      }
      // No closing delimiter (or empty span): treat marker as literal.
      localBuffer += delim;
      i += length;
      return true;
    };

    while (i < text.length) {
      if (endDelim && text.startsWith(endDelim, i) && !isEscaped(text, i)) {
        flushLocal();
        return { endIndex: i + endDelim.length, closed: true, children: out };
      }

      const ch = text[i] ?? "";
      const next = text[i + 1] ?? "";

      if (tryConsumeEscapedCharacter(ch, next)) {
        continue;
      }

      if (tryConsumeDelimitedToken()) {
        continue;
      }

      if (tryConsumeEmphasis(ch)) {
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

export function renderGuideLinkTokens(
  value: string | null | undefined,
  lang: AppLanguage,
  keyBase: string,
  guideKey?: string,
): ReactNode[] {
  const text = typeof value === "string" ? value : "";
  return renderInline(text, lang, keyBase, guideKey);
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

export function renderBodyBlocks(
  blocks: readonly string[] | null | undefined,
  lang: AppLanguage,
  keyBase: string,
  guideKey?: string,
): ReactNode[] {
  const items = Array.isArray(blocks) ? blocks : [];
  const out: ReactNode[] = [];

  const renderList = (listItems: readonly string[], listKey: string) => (
    <ul key={listKey}>
      {listItems.map((item, index) => (
        <li key={`${listKey}-li-${index}`}>
          {renderGuideLinkTokens(item, lang, `${listKey}-li-${index}`, guideKey)}
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
        {renderGuideLinkTokens(block, lang, `${keyBase}-p-${i}`, guideKey)}
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
