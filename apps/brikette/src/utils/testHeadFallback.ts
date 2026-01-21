"use client";

// src/utils/testHeadFallback.ts
// Helper to inject head tags directly into document.head during tests
// Useful when route meta()/links() aren't wired through a framework router.
import { useEffect, useLayoutEffect } from "react";
import type { LinksFunction, MetaDescriptor } from "react-router";

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

export function applyMetaDescriptor(descriptor: MetaDescriptor): Cleanup | undefined {
  if (typeof document === "undefined" || !descriptor) return undefined;

  const dUnknown = descriptor as Record<string, unknown>;
  if ("title" in descriptor && typeof dUnknown["title"] === "string") {
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

  const record = descriptor as Record<string, string | undefined>;
  const keyName =
    typeof record["name"] === "string"
      ? "name"
      : typeof record["property"] === "string"
      ? "property"
      : typeof record["httpEquiv"] === "string"
      ? "http-equiv"
      : typeof record["charSet"] === "string"
      ? "charset"
      : undefined;
  const keyValue =
    keyName === "name"
      ? record["name"]
      : keyName === "property"
      ? record["property"]
      : keyName === "http-equiv"
      ? record["httpEquiv"]
      : keyName === "charset"
      ? record["charSet"]
      : undefined;

  let el: HTMLMetaElement | null = null;
  if (keyName && keyValue) {
    el = document.head.querySelector(`meta[${keyName}="${escapeAttr(keyValue)}"]`);
  }

  // If an element exists for this key but represents a different content value
  // (e.g. multiple og:locale:alternate entries), create a fresh element.
  if (
    el &&
    typeof record["content"] === "string" &&
    el.getAttribute("content") !== record["content"]
  ) {
    const allowDuplicate =
      keyName === "property" && typeof keyValue === "string" && MULTI_VALUE_META_KEYS.has(keyValue);
    if (!allowDuplicate) {
      // Reuse the existing element by allowing the attribute update below.
    } else {
      el = null;
    }
  }

  const created = !el;
  if (!el) {
    el = document.createElement("meta");
    if (keyName && keyValue) el.setAttribute(keyName, keyValue);
    document.head.appendChild(el);
  }

  const previous = new Map<string, string | null>();
  Object.entries(record).forEach(([raw, value]) => {
    if (value == null) return;
    const attr = normaliseName(raw);
    if (attr === "title") return;
    previous.set(attr, el!.getAttribute(attr));
    el!.setAttribute(attr, String(value));
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
  links: ReturnType<LinksFunction> | undefined | null,
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
  links: ReturnType<LinksFunction> | undefined,
): void {
  useBrowserLayoutEffect(() => {
    if (process.env.NODE_ENV !== "test") return;
    const extractedLinks: ReturnType<LinksFunction> = [];
    const filteredMeta = (meta ?? []).flatMap((descriptor) => {
      if (
        descriptor &&
        typeof descriptor === "object" &&
        "tagName" in descriptor &&
        (descriptor as Record<string, unknown>)["tagName"] === "link"
      ) {
        const descriptorRecord = descriptor as Record<string, string | undefined>;
        const { ["tagName"]: _ignored, ...rest } = descriptorRecord;
        extractedLinks.push(rest as ReturnType<LinksFunction>[number]);
        return [];
      }
      return [descriptor as MetaDescriptor];
    });
    return applyHeadDescriptors(filteredMeta, [...(links ?? []), ...extractedLinks]);
  }, [meta, links]);
}
