/**
 * Transform legacy route content to guide content format.
 *
 * Implements the schema mapping documented in TASK-05:
 * - meta → seo
 * - header → intro
 * - tip/aside/cta → callouts with link tokens
 * - sections object → sections array with stable IDs
 * - linkBindings (linkObject + placeholders) → guide tokens
 * - galleries → gallery metadata
 */

import type { LinkBinding, LinkTarget } from "@/lib/how-to-get-here/definitions";
import type { LinkedCopy, RouteContent } from "@/lib/how-to-get-here/schema";

interface GuideContent {
  seo: {
    title: string;
    description: string;
  };
  intro: {
    title: string;
    body: string;
  };
  callouts?: {
    tip?: string;
    aside?: string;
    cta?: string;
  };
  sections?: Array<{
    id: string;
    title?: string;
    body?: string;
    list?: string[];
  }>;
  galleries?: Array<{
    heading?: string;
    items: Array<{
      src: string;
      caption?: string;
      alt?: string;
      aspectRatio?: string;
      preset?: string;
    }>;
  }>;
}

interface RouteDefinition {
  contentKey?: string;
  linkBindings?: LinkBinding[];
  galleries?: Array<{
    key: string;
    items: Array<{
      id: string;
      src: string;
      aspectRatio?: string;
      preset?: string;
    }>;
  }>;
}

/**
 * Convert link target to guide token format.
 */
function linkTargetToToken(target: LinkTarget, label: string): string {
  switch (target.type) {
    case "howToOverview":
      return `%HOWTO:how-to-get-here|${label}%`;
    case "guide":
      return `%LINK:${target.guideKey}|${label}%`;
    case "directions":
      return `%HOWTO:${target.slug}|${label}%`;
    case "guidesSlug":
      return `%LINK:${target.slug}|${label}%`;
    case "external":
      return `%URL:${target.href}|${label}%`;
    default:
      return label;
  }
}

/**
 * Convert LinkedCopy (split text) to string with guide token.
 */
function linkedCopyToString(linkedCopy: LinkedCopy, target: LinkTarget): string {
  const { before = "", linkLabel, after = "" } = linkedCopy;
  const token = linkTargetToToken(target, linkLabel);
  return `${before}${token}${after}`;
}

/**
 * Replace placeholder tags like <link>Label</link> with guide tokens.
 */
function replacePlaceholders(
  text: string,
  placeholders: Record<string, LinkTarget | null>,
): string {
  let result = text;

  for (const [placeholderName, target] of Object.entries(placeholders)) {
    if (!target) continue;

    // Match <placeholderName>Label</placeholderName> (case-sensitive)
    const regex = new RegExp(`<${placeholderName}>([^<]+)</${placeholderName}>`, "g");
    result = result.replace(regex, (_match, label: string) => {
      return linkTargetToToken(target, label);
    });
  }

  return result;
}

/**
 * Find link binding for a given key path.
 */
function findBinding(bindings: LinkBinding[], keyPath: string): LinkBinding | undefined {
  // Direct match
  const direct = bindings.find((b) => b.key === keyPath);
  if (direct) return direct;

  // Wildcard match (e.g., "sections.*.list" matches "sections.foo.list")
  for (const binding of bindings) {
    if (binding.key.includes("*")) {
      const pattern = binding.key.replace(/\*/g, "[^.]+");
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(keyPath)) {
        return binding;
      }
    }
  }

  return undefined;
}

/**
 * Process callout content with link bindings.
 */
function processCallout(
  callout: any,
  variantKey: string,
  linkBindings: LinkBinding[],
): string | undefined {
  const bodyKey = `${variantKey}.body`;
  const copyKey = `${variantKey}.copy`;
  const binding = findBinding(linkBindings, bodyKey) || findBinding(linkBindings, copyKey);

  if (!binding) {
    // No bindings - return plain text
    if (typeof callout.copy === "string") return callout.copy;
    if (typeof callout.body === "string") return callout.body;
    if (typeof callout.body === "object" && "linkLabel" in callout.body) {
      // LinkedCopy without binding - just concatenate
      const { before = "", linkLabel, after = "" } = callout.body;
      return `${before}${linkLabel}${after}`;
    }
    return undefined;
  }

  // Has bindings
  if (binding.linkObject) {
    // linkObject pattern (split text)
    const body = callout.body;
    if (typeof body === "object" && "linkLabel" in body) {
      return linkedCopyToString(body, binding.linkObject);
    }
  }

  if (binding.placeholders) {
    // placeholders pattern (template-based)
    const text = callout.copy || callout.body;
    if (typeof text === "string") {
      return replacePlaceholders(text, binding.placeholders);
    }
  }

  return undefined;
}

/**
 * Process section field with link bindings.
 */
function processSectionField(
  value: any,
  keyPath: string,
  linkBindings: LinkBinding[],
): string | undefined {
  const binding = findBinding(linkBindings, keyPath);

  if (!binding) {
    // No binding - return plain text
    if (typeof value === "string") return value;
    if (typeof value === "object" && "linkLabel" in value) {
      const { before = "", linkLabel, after = "" } = value;
      return `${before}${linkLabel}${after}`;
    }
    return undefined;
  }

  // Has binding
  if (binding.linkObject) {
    if (typeof value === "object" && "linkLabel" in value) {
      return linkedCopyToString(value, binding.linkObject);
    }
  }

  if (binding.placeholders) {
    if (typeof value === "string") {
      return replacePlaceholders(value, binding.placeholders);
    }
  }

  return undefined;
}

/**
 * Transform route content to guide content.
 */
export function transformRouteToGuide(
  routeDefinition: RouteDefinition,
  routeContent: RouteContent,
  guideKey: string,
): GuideContent {
  const linkBindings = routeDefinition.linkBindings || [];

  // Extract meta
  const meta = routeContent.meta as any;
  if (!meta || typeof meta !== "object") {
    throw new Error("Route content missing meta block");
  }

  // Extract header
  const header = routeContent.header as any;
  if (!header || typeof header !== "object") {
    throw new Error("Route content missing header block");
  }

  // Build guide content
  const guide: GuideContent = {
    seo: {
      title: meta.title as string,
      description: meta.description as string,
    },
    intro: {
      title: header.title as string,
      body: header.description as string,
    },
  };

  // Process callouts
  const callouts: Record<string, string> = {};
  for (const variant of ["tip", "aside", "cta"]) {
    const callout = routeContent[variant];
    if (callout && typeof callout === "object") {
      const processed = processCallout(callout, variant, linkBindings);
      if (processed) {
        callouts[variant] = processed;
      }
    }
  }
  if (Object.keys(callouts).length > 0) {
    guide.callouts = callouts as any;
  }

  // Process sections
  const sections = routeContent.sections;
  if (sections && typeof sections === "object" && !Array.isArray(sections)) {
    guide.sections = Object.entries(sections).map(([id, section]: [string, any]) => {
      const guideSection: any = { id };

      if (section.title) {
        guideSection.title = section.title;
      }

      // Body field
      if (section.body) {
        const processed = processSectionField(section.body, `sections.${id}.body`, linkBindings);
        if (processed) guideSection.body = processed;
      }

      // Link field (merge into body)
      if (section.link) {
        const processed = processSectionField(section.link, `sections.${id}.link`, linkBindings);
        if (processed) {
          guideSection.body = guideSection.body
            ? `${guideSection.body} ${processed}`
            : processed;
        }
      }

      // CTA field (merge into body)
      if (section.cta) {
        const processed = processSectionField(section.cta, `sections.${id}.cta`, linkBindings);
        if (processed) {
          guideSection.body = guideSection.body
            ? `${guideSection.body} ${processed}`
            : processed;
        }
      }

      // Intro field (merge into body)
      if (section.intro) {
        const processed = processSectionField(section.intro, `sections.${id}.intro`, linkBindings);
        if (processed) {
          guideSection.body = processed;
        }
      }

      // List fields (points or list)
      const list = section.points || section.list;
      if (Array.isArray(list)) {
        guideSection.list = list.map((item: any) => {
          if (typeof item === "string") return item;
          return item;
        });
      }

      return guideSection;
    });
  }

  // Process galleries
  if (routeDefinition.galleries && routeDefinition.galleries.length > 0) {
    guide.galleries = routeDefinition.galleries.map((galleryDef) => {
      const keyParts = galleryDef.key.split(".");
      let contentGallery: any = routeContent;
      for (const part of keyParts.slice(0, -1)) {
        contentGallery = contentGallery?.[part];
      }

      const gallery: any = {};

      if (contentGallery?.heading) {
        gallery.heading = contentGallery.heading;
      }

      gallery.items = galleryDef.items.map((item, index) => {
        const contentItem = contentGallery?.items?.[index] || {};
        return {
          src: item.src,
          caption: contentItem.caption,
          alt: contentItem.alt,
          aspectRatio: item.aspectRatio,
          preset: item.preset,
        };
      });

      return gallery;
    });
  }

  return guide;
}
