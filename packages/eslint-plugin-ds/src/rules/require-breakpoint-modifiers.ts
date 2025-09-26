import type { Rule } from "eslint";
import { extractFromJsxAttribute } from "../utils/classParser.js";

const BREAKPOINTS = new Set(["sm", "md", "lg", "xl", "2xl"]);

const LAYOUT_EQUALS = new Set([
  "flex",
  "inline-flex",
  "grid",
  "inline-grid",
  "table",
  "block",
  "inline",
  "flow-root",
  "container",
]);
const LAYOUT_PREFIXES = [
  "gap-",
  "space-x-",
  "space-y-",
  "m-",
  "mx-",
  "my-",
  "mt-",
  "mr-",
  "mb-",
  "ml-",
  "p-",
  "px-",
  "py-",
  "pt-",
  "pr-",
  "pb-",
  "pl-",
  "w-",
  "h-",
  "min-w-",
  "max-w-",
  "min-h-",
  "max-h-",
  "justify-",
  "items-",
  "content-",
  "place-",
  "order-",
  "col-",
  "row-",
  "aspect-",
];

function hasBreakpoint(token: string): boolean {
  const parts = token.split(":");
  if (parts.length <= 1) return false;
  // check any prefix segment is a known breakpoint
  for (let i = 0; i < parts.length - 1; i++) {
    if (BREAKPOINTS.has(parts[i])) return true;
  }
  return false;
}

function lastSegment(token: string): string {
  const i = token.lastIndexOf(":");
  return i >= 0 ? token.slice(i + 1) : token;
}

function isLayoutUtility(token: string): boolean {
  const base = lastSegment(token);
  if (LAYOUT_EQUALS.has(base)) return true;
  return LAYOUT_PREFIXES.some((p) => base.startsWith(p));
}

function fileHasResponsiveTag(context: Rule.RuleContext): boolean {
  const sc = (context as any).sourceCode || context.getSourceCode();
  const comments = sc?.getAllComments?.() || [];
  return comments.some((c: any) => /@responsive\b/.test(c.value));
}

const rule: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "For files tagged with @responsive, require at least one breakpoint modifier (sm:/md:/lg:/xl:/2xl:) on a layout utility.",
      recommended: false,
    },
    schema: [],
    messages: {
      addBreakpoint:
        "Add responsive breakpoint modifiers (e.g., sm: or md:) to at least one layout class in @responsive components.",
    },
  },
  create(context) {
    const enabled = fileHasResponsiveTag(context);
    let sawResponsiveLayout = false;

    return {
      JSXAttribute(node: any) {
        if (!enabled) return;
        if (!(node.name?.name === "class" || node.name?.name === "className")) return;
        const parsed = extractFromJsxAttribute(node);
        if (!parsed || !parsed.confident) return;
        for (const cls of parsed.classes) {
          if (hasBreakpoint(cls) && isLayoutUtility(cls)) {
            sawResponsiveLayout = true;
            break;
          }
        }
      },
      'Program:exit'() {
        if (!enabled) return;
        if (!sawResponsiveLayout) {
          const sc = (context as any).sourceCode || context.getSourceCode();
          const node = sc?.ast?.body?.[0] || (sc as any).ast;
          context.report({ node, messageId: "addBreakpoint" });
        }
      },
    } as Rule.RuleListener;
  },
};

export default rule;
