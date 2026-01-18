import type { Locale, Page, PageComponent } from "@acme/types";
/**
 * High-level classification for a template.
 *
 * - "page" – full-page templates (home, PLP, PDP, checkout shell).
 * - "section" – reusable sections that can be inserted into pages.
 * - "slot-fragment" – templates targeting a specific runtime slot.
 */
export type TemplateKind = "page" | "section" | "slot-fragment";
/**
 * Origin of a template descriptor.
 *
 * - "core" – shipped with the platform.
 * - "remote" – loaded from a remote catalog/feed.
 * - "library" – user- or shop-specific templates.
 */
export type TemplateOrigin = "core" | "remote" | "library";
/**
 * Declarative description of a page/section template.
 *
 * The components tree is stored as PageBuilder components without
 * shop- or locale-specific data baked in. Callers are responsible for
 * applying localisation and shop defaults when scaffolding concrete pages.
 */
export interface TemplateDescriptor {
    /** Stable identifier for this template (used for provenance). */
    id: string;
    /** Human-readable version string, primarily informational. */
    version: string;
    kind: TemplateKind;
    label: string;
    description?: string;
    /**
     * Coarse category used by UIs when grouping templates.
     *
     * This is intentionally small; more detailed tagging can be added later
     * without breaking existing descriptors.
     */
    category: "Hero" | "Features" | "Commerce" | "Legal" | "System";
    /**
     * Intended usage for the template.
     *
     * - "marketing" – marketing/landing pages (home, campaigns, PLP).
     * - "legal" – legal/policy and system pages.
     * - "fragment" – partials reused across pages.
     */
    pageType?: "marketing" | "legal" | "fragment";
    /**
     * Named slots for slot-fragment templates.
     *
     * For page templates this is typically empty.
     */
    slots?: string[];
    /**
     * Core content as a raw PageBuilder components tree.
     *
     * Components must use the shared PageComponent union so they can be
     * validated via `pageComponentSchema` and rendered by DynamicRenderer.
     */
    components: PageComponent[];
    /**
     * Optional preview image for UI pickers.
     *
     * When present, UIs can render a thumbnail before applying a template
     * or swapping an existing page.
     */
    previewImage?: string;
    /** Provenance of the descriptor (core, remote feed, or per-shop library). */
    origin?: TemplateOrigin;
}
/**
 * Context passed when scaffolding a concrete Page from a template.
 *
 * This is intentionally small; callers can extend their own context
 * with additional fields as needed (for example, theme or channel).
 */
export interface ScaffoldContext {
    shopId: string;
    locale: Locale;
    primaryLocale: Locale;
}
/**
 * Lightweight helper to clone a template's component tree.
 *
 * Templates may be shared between shops; callers should treat the returned
 * array as mutable and can re-id components as needed.
 */
export declare function cloneTemplateComponents(descriptor: TemplateDescriptor): PageComponent[];
/**
 * Scaffold a minimal Page object from a template.
 *
 * This helper intentionally keeps semantics simple:
 * - Uses the template label as the SEO title for the primary locale.
 * - Leaves slug, createdAt/updatedAt, and createdBy to the caller.
 * - Does not mutate the template descriptor.
 *
 * Callers are expected to post-process the returned Page (for example,
 * by assigning an id/slug and persisting it via repositories).
 */
export declare function scaffoldPageFromTemplate(descriptor: TemplateDescriptor, ctx: ScaffoldContext, overrides?: Partial<Omit<Page, "components" | "seo">> & {
    seo?: Partial<Page["seo"]>;
}): Page;
