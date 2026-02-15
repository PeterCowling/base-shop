"use client";

// src/utils/testHeadFallback.ts
// Helper to inject head tags directly into document.head during tests
// Useful when route meta()/links() aren't wired through a framework router.
import { useEffect, useLayoutEffect } from "react";

// Local types replacing react-router imports
type MetaDescriptor = Record<string, string | undefined>;
type LinkDescriptor = Record<string, string | undefined>;

const ATTRIBUTE_NAME_OVERRIDES: Record<string, string> = {
  charSet: "charset",
  httpEquiv: "http-equiv",
  hrefLang: "hreflang",
};

const escapeAttr = (value: string) => value.replace(/"/g, '\\"');
const normaliseName = (name: string) => ATTRIBUTE_NAME_OVERRIDES[name] ?? name;

const MULTI_VALUE_META_KEYS = new Set<string>(["og:locale:alternate"]);

type Cleanup = () => void;

function applyTitleDescriptor(descriptor: MetaDescriptor): Cleanup | undefined {
  const dUnknown = descriptor as Record<string, unknown>;
  if (!("title" in descriptor) || typeof dUnknown["title"] !== "string") return undefined;

  const nextTitle = dUnknown["title"] as string;
  const prevText = document.title;
  let titleEl = document.head.querySelector<HTMLTitleElement>("title");
  const created = !titleEl;
  if (!titleEl) {
    titleEl = document.createElement("title");
    document.head.appendChild(titleEl);
  }
  const prevNodeText = titleEl.textContent ?? null;
  document.title = nextTitle;
  titleEl.textContent = nextTitle;
  return () => {
    // Restore both document.title and the <title> node
    document.title = prevText;
    const existing = document.head.querySelector<HTMLTitleElement>("title");
    if (!existing) return;
    if (created) {
      existing.remove();
    } else {
      existing.textContent = prevNodeText;
    }
  };
}

function resolveMetaKey(record: Record<string, string | undefined>): { keyName?: string; keyValue?: string } {
  if (typeof record["name"] === "string") return { keyName: "name", keyValue: record["name"] };
  if (typeof record["property"] === "string") return { keyName: "property", keyValue: record["property"] };
  if (typeof record["httpEquiv"] === "string") return { keyName: "http-equiv", keyValue: record["httpEquiv"] };
  if (typeof record["charSet"] === "string") return { keyName: "charset", keyValue: record["charSet"] };
  return {};
}

function shouldCreateDuplicateMeta(params: {
  el: HTMLMetaElement;
  record: Record<string, string | undefined>;
  keyName: string;
  keyValue: string;
}): boolean {
  const { el, record, keyName, keyValue } = params;
  const content = record["content"];
  if (typeof content !== "string") return false;
  if (el.getAttribute("content") === content) return false;
  return keyName === "property" && MULTI_VALUE_META_KEYS.has(keyValue);
}

function upsertMetaElement(params: {
  keyName?: string;
  keyValue?: string;
  record: Record<string, string | undefined>;
}): { el: HTMLMetaElement; created: boolean } {
  const { keyName, keyValue, record } = params;
  let el: HTMLMetaElement | null = null;
  if (keyName && keyValue) {
    el = document.head.querySelector(`meta[${keyName}="${escapeAttr(keyValue)}"]`);
    if (el && shouldCreateDuplicateMeta({ el, record, keyName, keyValue })) {
      el = null;
    }
  }

  const created = !el;
  if (!el) {
    el = document.createElement("meta");
    if (keyName && keyValue) el.setAttribute(keyName, keyValue);
    document.head.appendChild(el);
  }

  return { el, created };
}

function applyDescriptorAttributes(el: HTMLElement, record: Record<string, string | undefined>): Map<string, string | null> {
  const previous = new Map<string, string | null>();
  for (const [raw, value] of Object.entries(record)) {
    if (value == null) continue;
    const attr = normaliseName(raw);
    if (attr === "title") continue;
    previous.set(attr, el.getAttribute(attr));
    el.setAttribute(attr, String(value));
  }
  return previous;
}

export function applyMetaDescriptor(descriptor: MetaDescriptor): Cleanup | undefined {
  if (typeof document === "undefined" || !descriptor) return undefined;

  const titleCleanup = applyTitleDescriptor(descriptor);
  if (titleCleanup) return titleCleanup;

  const record = descriptor as Record<string, string | undefined>;
  const { keyName, keyValue } = resolveMetaKey(record);
  const { el, created } = upsertMetaElement({ keyName, keyValue, record });
  const previous = applyDescriptorAttributes(el, record);

  return () => {
    if (created) {
      el.remove();
      return;
    }
    previous.forEach((prev, attr) => {
      if (prev === null) el.removeAttribute(attr);
      else el.setAttribute(attr, prev);
    });
  };
}

export function applyLinkDescriptor(descriptor: LinkDescriptor): Cleanup | undefined {
  if (typeof document === "undefined" || !descriptor) return undefined;
  const rel = descriptor["rel"];
  if (typeof rel !== "string" || !rel) return undefined;

  const dUnknown = descriptor as Record<string, unknown>;
  const hrefLangMaybe = descriptor["hreflang"] ?? dUnknown["hrefLang"];
  const hrefLang = typeof hrefLangMaybe === "string" ? hrefLangMaybe : undefined;
  const selector: string[] = [`link[rel="${escapeAttr(rel)}"]`];
  if (hrefLang) selector.push(`[hreflang="${escapeAttr(String(hrefLang))}"]`);
  else if (descriptor["href"]) selector.push(`[href="${escapeAttr(String(descriptor["href"]))}"]`);

  let el: HTMLLinkElement | null = document.head.querySelector(selector.join(""));
  const created = !el;
  if (!el) {
    el = document.createElement("link");
    document.head.appendChild(el);
  }

  const previous = new Map<string, string | null>();
  Object.keys(descriptor).forEach((raw) => {
    if (raw === "tagName") return;
    const attr = normaliseName(raw);
    const val = (descriptor as Record<string, unknown>)[raw];
    if (val == null) return;
    previous.set(attr, el!.getAttribute(attr));
    el!.setAttribute(attr, String(val));
  });

  return () => {
    if (!el) return;
    if (created) {
      el.remove();
      return;
    }
    previous.forEach((prev, attr) => {
      if (prev === null) el!.removeAttribute(attr);
      else el!.setAttribute(attr, prev);
    });
  };
}

export function applyHeadDescriptors(
  meta: MetaDescriptor[] | undefined | null,
  links: LinkDescriptor[] | undefined | null,
): Cleanup | undefined {
  if (typeof document === "undefined") return undefined;
  const cleanups: Cleanup[] = [];
  try {
    (meta ?? []).forEach((d) => {
      const cleanup = applyMetaDescriptor(d);
      if (cleanup) cleanups.push(cleanup);
    });
    (links ?? []).forEach((d) => {
      const cleanup = applyLinkDescriptor(d as unknown as LinkDescriptor);
      if (cleanup) cleanups.push(cleanup);
    });
  } catch {
    void 0;
  }

  if (cleanups.length === 0) return undefined;

  return () => {
    cleanups.reverse().forEach((fn) => {
      try {
        fn();
      } catch {
        void 0;
      }
    });
  };
}

const useBrowserLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function useApplyFallbackHead(
  meta: MetaDescriptor[] | undefined,
  links: LinkDescriptor[] | undefined,
): void {
  useBrowserLayoutEffect(() => {
    if (process.env.NODE_ENV !== "test") return;
    const extractedLinks: LinkDescriptor[] = [];
    const filteredMeta = (meta ?? []).flatMap((descriptor) => {
      if (
        descriptor &&
        typeof descriptor === "object" &&
        "tagName" in descriptor &&
        (descriptor as Record<string, unknown>)["tagName"] === "link"
      ) {
        const descriptorRecord = descriptor as Record<string, string | undefined>;
        const { ["tagName"]: _ignored, ...rest } = descriptorRecord;
        extractedLinks.push(rest as LinkDescriptor);
        return [];
      }
      return [descriptor as MetaDescriptor];
    });
    return applyHeadDescriptors(filteredMeta, [...(links ?? []), ...extractedLinks]);
  }, [meta, links]);
}
