"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePlacement = validatePlacement;
exports.canDropChild = canDropChild;
function getChildren(node) {
    const maybeChildren = node.children;
    if (Array.isArray(maybeChildren))
        return maybeChildren;
    return undefined;
}
function walk(node, fn, path = []) {
    if (!node || typeof node !== "object")
        return;
    fn(node, path);
    const children = getChildren(node);
    if (children)
        children.forEach((c, i) => walk(c, fn, [...path, "children", i]));
}
// Minimal, platform-core copy of builder placement rules
const CONTAINER_TYPES = new Set([
    "Section",
    "Canvas",
    "MultiColumn",
    "StackFlex",
    "Grid",
    "CarouselContainer",
    "TabsAccordionContainer",
    "Tabs",
    "Dataset",
    "Repeater",
    "Bind",
]);
const LAYOUT_TYPES = new Set(["Canvas"]);
function isContainerType(t) {
    return CONTAINER_TYPES.has(t);
}
function isLayoutType(t) {
    return LAYOUT_TYPES.has(t);
}
function getAllowedChildren(parent, sectionsOnly) {
    // Treat any non-container/layout as content and allow under containers/layout roots
    // We implement via category predicates, not enumerating all content types.
    const allowContent = new Set(["__CONTENT__"]);
    if (parent === "ROOT") {
        const s = new Set();
        s.add("Section");
        if (!sectionsOnly)
            s.add("Canvas");
        return s;
    }
    if (parent === "Section" || parent === "Canvas") {
        // Sections/Canvas may contain containers and content
        const s = new Set(CONTAINER_TYPES);
        s.delete("Section"); // prevent nested full sections by default
        // model content via sentinel
        s.add("__CONTENT__");
        return s;
    }
    if (isContainerType(String(parent)) || isLayoutType(String(parent))) {
        // Generic containers allow content only
        return allowContent;
    }
    // Unknown parent: disallow all
    return new Set();
}
function isAllowedChild(parent, childType, sectionsOnly) {
    const allowed = getAllowedChildren(parent, sectionsOnly);
    if (allowed.has(childType))
        return true;
    // Treat any non-container/layout as content, allowed when '__CONTENT__' is present
    if (!isContainerType(childType) && !isLayoutType(childType) && allowed.has("__CONTENT__"))
        return true;
    return false;
}
function validatePlacement(nodes, options) {
    const list = Array.isArray(nodes) ? nodes : [nodes];
    const sectionsOnly = Boolean(options?.sectionsOnly);
    const parent = options.parent;
    const issues = [];
    list.forEach((root, idx) => {
        const rootPath = [idx];
        const t = String(root.type || "");
        if (!isAllowedChild(parent, t, sectionsOnly)) {
            issues.push({ path: rootPath, message: `Type '${t}' is not allowed under ${String(parent)}.` });
        }
        // Validate subtree recursively by treating each node as parent for its children
        walk(root, (n, p) => {
            const kids = getChildren(n) || [];
            if (!kids.length)
                return;
            const parentKind = String(n.type || "");
            kids.forEach((_c, i) => {
                const c = kids[i];
                const ct = String(c?.type || "");
                if (!isAllowedChild(parentKind, ct, sectionsOnly)) {
                    issues.push({ path: [idx, ...p.slice(1), "children", i], message: `Type '${ct}' is not allowed under '${parentKind}'.` });
                }
            });
        }, rootPath);
    });
    if (!issues.length)
        return { ok: true };
    return { ok: false, errors: Array.from(new Set(issues.map((i) => i.message))), issues };
}
function canDropChild(parent, child, sectionsOnly) {
    return isAllowedChild(parent, child, Boolean(sectionsOnly));
}
