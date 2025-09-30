import type { PageComponent } from "@acme/types";

export type ValidationIssue = { path: Array<string | number>; message: string };
export type ValidationResult = { ok: true } | { ok: false; errors: string[]; issues?: ValidationIssue[] };

export type ParentKind = "ROOT" | string;

type WithChildren = { children?: unknown };

function getChildren(node: PageComponent): PageComponent[] | undefined {
  const maybeChildren = (node as unknown as WithChildren).children;
  if (Array.isArray(maybeChildren)) return maybeChildren as PageComponent[];
  return undefined;
}

function walk(
  node: PageComponent,
  fn: (n: PageComponent, path: Array<string | number>) => void,
  path: Array<string | number> = [],
): void {
  if (!node || typeof node !== "object") return;
  fn(node, path);
  const children = getChildren(node);
  if (children) children.forEach((c, i) => walk(c, fn, [...path, "children", i]));
}

// Minimal, platform-core copy of builder placement rules
const CONTAINER_TYPES = new Set<string>([
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

const LAYOUT_TYPES = new Set<string>(["Canvas"]);

function isContainerType(t: string): boolean {
  return CONTAINER_TYPES.has(t);
}

function isLayoutType(t: string): boolean {
  return LAYOUT_TYPES.has(t);
}

function getAllowedChildren(parent: ParentKind, sectionsOnly: boolean): Set<string> {
  // Treat any non-container/layout as content and allow under containers/layout roots
  // We implement via category predicates, not enumerating all content types.
  const allowContent = new Set<string>(["__CONTENT__"]);

  if (parent === "ROOT") {
    const s = new Set<string>();
    s.add("Section");
    if (!sectionsOnly) s.add("Canvas");
    return s;
  }

  if (parent === "Section" || parent === "Canvas") {
    // Sections/Canvas may contain containers and content
    const s = new Set<string>(CONTAINER_TYPES);
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
  return new Set<string>();
}

function isAllowedChild(parent: ParentKind, childType: string, sectionsOnly: boolean): boolean {
  const allowed = getAllowedChildren(parent, sectionsOnly);
  if (allowed.has(childType)) return true;
  // Treat any non-container/layout as content, allowed when '__CONTENT__' is present
  if (!isContainerType(childType) && !isLayoutType(childType) && allowed.has("__CONTENT__")) return true;
  return false;
}

export function validatePlacement(
  nodes: PageComponent[] | PageComponent,
  options: { parent: ParentKind; sectionsOnly?: boolean },
): ValidationResult {
  const list = Array.isArray(nodes) ? nodes : [nodes];
  const sectionsOnly = Boolean(options?.sectionsOnly);
  const parent = options.parent;
  const issues: ValidationIssue[] = [];

  list.forEach((root, idx) => {
    const rootPath = [idx] as Array<string | number>;
    const t = String(root.type || "");
    if (!isAllowedChild(parent, t, sectionsOnly)) {
      issues.push({ path: rootPath, message: `Type '${t}' is not allowed under ${String(parent)}.` });
    }
    // Validate subtree recursively by treating each node as parent for its children
    walk(root, (n, p) => {
      const kids = getChildren(n) || [];
      if (!kids.length) return;
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

  if (!issues.length) return { ok: true };
  return { ok: false, errors: Array.from(new Set(issues.map((i) => i.message))), issues };
}

export function canDropChild(parent: ParentKind, child: string, sectionsOnly?: boolean): boolean {
  return isAllowedChild(parent, child, Boolean(sectionsOnly));
}

