import type { ReactNode } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/design-system/primitives";
import { CfImage, CfResponsiveImage } from "@acme/ui/atoms";

import { ZoomIn } from "@/icons";
import { findPlaceholderBinding, type RouteDefinition } from "@/lib/how-to-get-here/definitions";
import type { RouteContent } from "@/lib/how-to-get-here/schema";

import { renderCallout } from "./callouts";
import { getValueAtPath, isPlainObject } from "./content-utils";
import { isLinkedCopy, renderLink, renderLinkedCopy, renderRichText, resolveLinkTarget } from "./linking";
import type { RenderContext } from "./types";

export function getSections(
  definition: RouteDefinition,
  content: RouteContent,
): [string, unknown][] {
  if (definition.sectionPaths && definition.sectionPaths.length > 0) {
    return definition.sectionPaths
      .map((path) => {
        const value = getValueAtPath(content, path);
        return [path, value] as [string, unknown];
      })
      .filter(([, value]) => value !== undefined && value !== null);
  }

  const rootKey = definition.sectionsRoot ?? "sections";
  const root = content[rootKey as keyof RouteContent];
  if (root && typeof root === "object") {
    return Object.entries(root as Record<string, unknown>).filter(
      ([, value]) => value !== undefined && value !== null,
    );
  }
  return [];
}

function processArrayValue(
  key: string,
  value: unknown[],
  path: string,
  ctx: RenderContext,
): { items: ReactNode[]; subSections: ReactNode[] } {
  const items: ReactNode[] = [];
  const subSections: ReactNode[] = [];
  const currentPath = `${path}.${key}`;

  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    if (typeof entry === "string") {
      const itemPath = `${currentPath}.${index}`;
      const binding =
        findPlaceholderBinding(ctx.definition, itemPath) ??
        findPlaceholderBinding(ctx.definition, currentPath);
      items.push(<li key={itemPath}>{renderRichText(entry, itemPath, binding, ctx)}</li>);
    } else if (isPlainObject(entry) && (entry["title"] || entry["heading"])) {
      subSections.push(renderSection(String(index), entry, ctx, currentPath));
    }
  }

  return { items, subSections };
}

function processStringValue(key: string, value: string, path: string, ctx: RenderContext): ReactNode {
  const currentPath = `${path}.${key}`;
  const binding = findPlaceholderBinding(ctx.definition, currentPath);
  return (
    <p key={currentPath} className="text-base leading-relaxed">
      {renderRichText(value, currentPath, binding, ctx)}
    </p>
  );
}

function processLinkedCopyValue(key: string, value: unknown, path: string, ctx: RenderContext): ReactNode {
  const currentPath = `${path}.${key}`;
  const binding = findPlaceholderBinding(ctx.definition, currentPath);
  if (!isLinkedCopy(value)) return null;
  return (
    <p key={currentPath} className="text-base leading-relaxed">
      {renderLinkedCopy(value, currentPath, binding, ctx, currentPath)}
    </p>
  );
}

function processNestedObjectValue(
  key: string,
  value: Record<string, unknown>,
  path: string,
  ctx: RenderContext,
): ReactNode | null {
  const currentPath = `${path}.${key}`;
  const binding = findPlaceholderBinding(ctx.definition, currentPath);
  const entries: ReactNode[] = [];

  for (const [nestedKey, nestedVal] of Object.entries(value)) {
    if (typeof nestedVal === "string") {
      entries.push(
        <p key={`${currentPath}-${nestedKey}`} className="text-base leading-relaxed">
          {renderRichText(nestedVal, `${currentPath}.${nestedKey}`, binding, ctx)}
        </p>,
      );
    }
  }

  if (entries.length === 0) return null;

  return (
    <div key={currentPath} className="space-y-2">
      {entries}
    </div>
  );
}

type ProcessedContent = {
  paragraphs: ReactNode[];
  lists: ReactNode[][];
  subSections: ReactNode[];
  figure: { src: string; alt: string; caption?: string } | null;
};

function handlePlainObjectValue(
  key: string,
  value: Record<string, unknown>,
  path: string,
  ctx: RenderContext,
  accumulated: ProcessedContent,
): boolean {
  const currentPath = `${path}.${key}`;
  const linkListNode = renderLinkListEntry(ctx.definition, ctx, currentPath, value);
  if (linkListNode) {
    accumulated.paragraphs.push(linkListNode);
    return true;
  }

  // Handle nested sections with titles
  if (value["title"] || value["heading"] || value["name"]) {
    const rendered = renderSection(key, value, ctx, path);
    if (rendered) {
      accumulated.subSections.push(rendered);
    }
    return true;
  }

  return false;
}

function processSectionEntry(
  key: string,
  value: unknown,
  path: string,
  ctx: RenderContext,
  accumulated: ProcessedContent,
): void {
  if (key === "title" || key === "heading" || key === "name") return;
  const currentPath = `${path}.${key}`;

  // Handle callouts
  if (key === "aside" || key === "tip" || key === "cta") {
    const calloutNode = renderCallout(currentPath, value, ctx);
    if (calloutNode) {
      accumulated.paragraphs.push(calloutNode);
      return;
    }
  }

  // Handle arrays
  if (Array.isArray(value)) {
    const result = processArrayValue(key, value, path, ctx);
    if (result.items.length > 0) {
      accumulated.lists.push(result.items);
    }
    accumulated.subSections.push(...result.subSections);
    return;
  }

  // Handle strings
  if (typeof value === "string") {
    accumulated.paragraphs.push(processStringValue(key, value, path, ctx));
    return;
  }

  // Handle linked copy
  if (isLinkedCopy(value)) {
    accumulated.paragraphs.push(processLinkedCopyValue(key, value, path, ctx));
    return;
  }

  // Handle figures
  if (key === "figure" || key === "image") {
    accumulated.figure = getFigure(currentPath, value, ctx.definition) ?? accumulated.figure;
    return;
  }

  // Handle plain objects (link lists and nested sections)
  if (isPlainObject(value)) {
    const handled = handlePlainObjectValue(key, value as Record<string, unknown>, path, ctx, accumulated);
    if (handled) return;
  }

  // Handle generic nested objects
  if (typeof value === "object" && value !== null) {
    const nestedNode = processNestedObjectValue(key, value as Record<string, unknown>, path, ctx);
    if (nestedNode) {
      accumulated.paragraphs.push(nestedNode);
    }
  }
}

export function renderSection(
  sectionKey: string,
  data: unknown,
  ctx: RenderContext,
  pathPrefix: string,
): ReactNode | null {
  if (!isPlainObject(data)) return null;

  const path = pathPrefix ? `${pathPrefix}.${sectionKey}` : sectionKey;
  const record = data as Record<string, unknown>;
  const title =
    (record["title"] as string | undefined) ??
    (record["heading"] as string | undefined) ??
    (record["name"] as string | undefined) ??
    undefined;

  const content: ProcessedContent = {
    paragraphs: [],
    lists: [],
    subSections: [],
    figure: null,
  };

  for (const [key, value] of Object.entries(data)) {
    processSectionEntry(key, value, path, ctx, content);
  }

  const { paragraphs, lists, subSections, figure } = content;

  if (!title && paragraphs.length === 0 && lists.length === 0 && !figure && subSections.length === 0) {
    return null;
  }

  const figureCaptionId =
    figure?.caption && path
      ? `${path.replace(/[^a-zA-Z0-9_-]+/g, "-")}-caption`
      : undefined;

  return (
    <section
      key={path}
      className="space-y-6 rounded-3xl border border-brand-outline/30 bg-brand-surface p-6 shadow-sm dark:border-brand-outline/20 dark:bg-brand-surface/80"
    >
      {title ? (
        <header>
          <h2 className="text-2xl font-semibold text-brand-heading dark:text-brand-text">{title}</h2>
        </header>
      ) : null}
      {paragraphs}
      {lists.map((items, index) => (
        <ul key={`${path}-list-${index}`} className="list-disc space-y-3 pl-5 text-base leading-relaxed">
          {items}
        </ul>
      ))}
      {renderInlineGallery(path, ctx)}
      {figure ? (
        <figure
          className="overflow-hidden rounded-2xl border border-brand-outline/20 shadow-sm"
          aria-labelledby={figureCaptionId}
        >
          <CfImage
            src={figure.src}
            preset="gallery"
            alt={figure.alt}
            className="size-full object-cover"
            data-aspect="4/3"
          />
          {figure.caption ? (
              <figcaption
                id={figureCaptionId}
                className="bg-brand-surface px-4 py-3 text-sm text-brand-text/70 dark:bg-brand-surface/70 dark:text-brand-text/80"
              >
              {figure.caption}
            </figcaption>
          ) : null}
        </figure>
      ) : null}
      {subSections}
    </section>
  );
}

function getFigure(
  sectionPath: string,
  value: unknown,
  definition: RouteDefinition,
): { src: string; alt: string; caption?: string } | null {
  if (!value || typeof value !== "object") return null;
  const mediaBinding = definition.media?.find(
    (entry) => entry.key === sectionPath || entry.key === `${sectionPath}.image`,
  );
  if (mediaBinding) {
    const captionRaw = (value as Record<string, unknown>)["caption"];
    return {
      src: mediaBinding.src,
      alt: String((value as Record<string, unknown>)["alt"] ?? ""),
      ...(typeof captionRaw === "string" ? { caption: captionRaw } : {}),
    };
  }

  const record = value as Record<string, unknown>;
  if (typeof record["src"] === "string") {
    const captionRaw = record["caption"];
    return {
      src: record["src"],
      alt: String(record["alt"] ?? ""),
      ...(typeof captionRaw === "string" ? { caption: captionRaw } : {}),
    };
  }
  return null;
}

function renderLinkListEntry(
  definition: RouteDefinition,
  ctx: RenderContext,
  path: string,
  value: Record<string, unknown>,
): ReactNode | null {
  const config = definition.linkLists?.find((entry) => entry.key === path);
  if (!config) return null;

  const links: ReactNode[] = [];
  for (const item of config.items) {
    const label = value[item.id];
    if (typeof label !== "string") continue;
    const target = resolveLinkTarget(item.target, ctx.context);
    links.push(renderLink(target, label, `${path}-${item.id}`));
  }

  if (links.length === 0) {
    return null;
  }

  const intro = typeof value["linksIntro"] === "string" ? value["linksIntro"] : undefined;
  const separator = typeof value["linksSeparator"] === "string" ? value["linksSeparator"] : "·";
  const suffix = typeof value["linksSuffix"] === "string" ? value["linksSuffix"] : "";

  const parts: ReactNode[] = [];

  if (intro) {
    parts.push(intro);
    parts.push(" ");
  }

  links.forEach((linkNode, index) => {
    if (index > 0) {
      parts.push(` ${separator} `);
    }
    parts.push(linkNode);
  });

  if (suffix) {
    const needsSpace = !/^[.,!?]/.test(suffix);
    if (needsSpace && parts.length > 0) {
      const last = parts[parts.length - 1];
      const lastHasTrailingSpace = typeof last === "string" && /\s$/.test(last);
      if (!lastHasTrailingSpace) {
        parts.push(" ");
      }
    }
    parts.push(suffix);
  }

  return (
    <p key={path} className="text-base leading-relaxed">
      {parts}
    </p>
  );
}

function renderInlineGallery(path: string, ctx: RenderContext): ReactNode | null {
  const gallery = ctx.definition.galleries.find(
    (entry) => entry.inline && matchesGalleryPath(entry.key, path),
  );
  if (!gallery) {
    return null;
  }

  const galleryMeta = getValueAtPath(ctx.content, gallery.key);
  const itemsMeta = isPlainObject(galleryMeta)
    ? (galleryMeta as Record<string, { alt?: string; caption?: string }>)
    : undefined;

  return (
    <div className="space-y-4">
      {/* eslint-disable-next-line ds/enforce-layout-primitives -- BRIK-005 [ttl=2026-03-15] (complex grid layout, DS Grid component doesn't support this pattern) */}
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-6 list-none p-0">
        {gallery.items.map((item) => {
          const meta = itemsMeta?.[item.id];
          const altText = meta?.alt ?? meta?.caption ?? item.id;
          return (
            <li key={item.id} className="m-0">
              <Dialog>
                <DialogTrigger asChild>
                  <button type="button" className="group w-full min-h-11 min-w-11 text-start">
                    <figure className="relative overflow-hidden rounded-2xl border border-brand-outline/20 bg-brand-surface shadow-sm dark:border-brand-outline/30">
                      <CfResponsiveImage
                        src={item.src}
                        alt={altText}
                        preset="gallery"
                        className="size-full object-cover"
                        data-aspect={item.aspectRatio ?? "4/3"}
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute end-3 top-3 inline-flex size-9 items-center justify-center rounded-full bg-brand-surface/80 text-brand-heading shadow-sm backdrop-blur transition group-hover:bg-brand-surface dark:bg-brand-surface/60 dark:text-brand-text"
                      >
                        <ZoomIn className="size-4" />
                      </span>
                      {meta?.caption ? (
                        <figcaption className="bg-brand-surface px-4 py-3 text-sm text-brand-text/80 dark:bg-brand-surface/70 dark:text-brand-text/80">
                          {meta.caption}
                        </figcaption>
                      ) : null}
                    </figure>
                  </button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{meta?.caption ?? altText}</DialogTitle>
                  </DialogHeader>
                  <div className="overflow-hidden rounded-2xl border border-brand-outline/20 bg-brand-surface shadow-sm dark:border-brand-outline/30 dark:bg-brand-surface/40">
                    <CfResponsiveImage
                      src={item.src}
                      alt={altText}
                      preset="hero"
                      className="size-full object-cover"
                      data-aspect={item.aspectRatio ?? "4/3"}
                      priority
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function matchesGalleryPath(galleryKey: string, sectionPath: string): boolean {
  const normalizedKey = galleryKey.replace(/\.items$/, "");
  return normalizedKey === sectionPath;
}
