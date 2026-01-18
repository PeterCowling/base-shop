"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloneTemplateComponents = cloneTemplateComponents;
exports.scaffoldPageFromTemplate = scaffoldPageFromTemplate;
/**
 * Lightweight helper to clone a template's component tree.
 *
 * Templates may be shared between shops; callers should treat the returned
 * array as mutable and can re-id components as needed.
 */
function cloneTemplateComponents(descriptor) {
    const clone = (components) => components.map((c) => {
        const copy = { ...c };
        const children = c.children;
        if (Array.isArray(children)) {
            copy.children = clone(children);
        }
        return copy;
    });
    return clone(descriptor.components);
}
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
function scaffoldPageFromTemplate(descriptor, ctx, overrides) {
    const now = new Date().toISOString();
    const { seo: overrideSeo, ...restOverrides } = overrides ?? {};
    const title = overrideSeo?.title && Object.keys(overrideSeo.title).length > 0
        ? overrideSeo.title
        : { [ctx.primaryLocale]: descriptor.label };
    const baseSeo = {
        title,
        description: overrideSeo?.description ?? {},
        image: overrideSeo?.image ?? {},
        noindex: overrideSeo?.noindex,
    };
    return {
        id: "",
        stableId: descriptor.id,
        slug: "",
        status: "draft",
        visibility: "public",
        components: cloneTemplateComponents(descriptor),
        seo: baseSeo,
        createdAt: now,
        updatedAt: now,
        createdBy: "",
        ...restOverrides,
    };
}
