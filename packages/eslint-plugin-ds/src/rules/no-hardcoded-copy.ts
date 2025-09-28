import type { Rule } from "eslint";

const MICROCOPY = new Set(
  [
    "ok",
    "okay",
    "save",
    "cancel",
    "submit",
    "close",
    "next",
    "back",
    "previous",
    "continue",
    "retry",
    "delete",
    "edit",
    "view",
    "more",
    "less",
    "yes",
    "no",
    "on",
    "off",
    "search",
    "loading",
    "loading...",
    "error",
    "warning",
    "info",
    "signin",
    "sign in",
    "signup",
    "sign up",
  ].map((s) => s.toLowerCase()),
);

function isA11yAttr(attrName: string | undefined): boolean {
  if (!attrName) return false;
  return (
    attrName.startsWith("aria-") ||
    attrName === "alt" ||
    attrName === "title" ||
    attrName === "ariaLabel" ||
    attrName === "ariaDescription"
  );
}

function isWrappedByT(node: any): boolean {
  let p: any = node.parent;
  while (p) {
    if (p.type === "CallExpression") {
      const callee = p.callee;
      if (callee?.type === "Identifier" && callee.name === "t") return true;
      if (callee?.type === "MemberExpression" && callee.property?.type === "Identifier" && callee.property.name === "t")
        return true;
    }
    if (p.type === "JSXExpressionContainer") {
      p = p.parent;
      continue;
    }
    p = p.parent;
  }
  return false;
}

function hasExemptComment(context: Rule.RuleContext, node: any): boolean {
  const sc = (context as any).sourceCode || context.getSourceCode();
  const all = sc.getAllComments?.() ?? [];
  const startLine = node.loc?.start?.line ?? 0;
  const EXEMPT_COMMENT_RE = /i18n-exempt(?:\s+file)?\s*--\s*([A-Z]{2,}-\d+)(?:[^\S\r\n]+ttl=\d{4}-\d{2}-\d{2})?/;
  return all.some((c: any) => {
    const text = String(c.value || "");
    if (!EXEMPT_COMMENT_RE.test(text)) return false;
    const endLine = c.loc?.end?.line ?? 0;
    return endLine === startLine || endLine === startLine - 1;
  });
}

function isTrivial(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  // Allow short microcopy-like fragments conservatively
  if (t.length <= 12) return true;
  const lower = t.toLowerCase();
  if (MICROCOPY.has(lower)) return true;
  // Very short with punctuation-only endings
  if (/^[\p{L}\p{N} ,.!?'"-]{1,4}$/u.test(t)) return true;
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow hardcoded copy; require i18n wrappers.",
      recommended: false,
      // Repo doc with concrete steps for adding keys and wiring t()
      url: "docs/i18n/add-translation-keys.md",
    },
    schema: [],
    messages: {
      hardcodedCopy:
        "Hardcoded copy detected. Move text into packages/i18n/src/<locale>.json and reference via t('key'). See docs/i18n/add-translation-keys.md. Exemptions are tech debt and only for non‑UI strings — they must include a ticket (// i18n-exempt -- ABC-123 [ttl=YYYY-MM-DD]) or they will be ignored.",
    },
  },
  create(context) {
    const sc = (context as any).sourceCode || context.getSourceCode();
    const EXEMPT_FILE_RE = /i18n-exempt\s+file\s*--\s*([A-Z]{2,}-\d+)(?:[^\S\r\n]+ttl=\d{4}-\d{2}-\d{2})?/;
    const fileExempt = (sc.getAllComments?.() ?? []).some((c: any) => EXEMPT_FILE_RE.test(String(c.value || "")));
    return {
      Literal(node: any) {
        if (fileExempt) return;
        if (typeof node.value !== "string") return;
        // Ignore module specifiers in import/export declarations
        const p = node.parent;
        // Ignore directive prologues like "use client", "use server", "use strict"
        if (p?.type === "ExpressionStatement" && (p as any).directive) {
          return;
        }
        if (
          p?.type === "ImportDeclaration" ||
          p?.type === "ExportAllDeclaration" ||
          (p?.type === "ExportNamedDeclaration" && (p as any).source)
        ) {
          return;
        }
        if (hasExemptComment(context, node)) return;
        // Ignore within allowed a11y attributes
        const parent = node.parent;
        if (parent?.type === "JSXAttribute") {
          const name = parent.name?.name as string | undefined;
          if (isA11yAttr(name)) return;
          // Non-user-facing attribute literals
          if (name === "role") return;
          if (name === "href") return;
          if (name === "viewBox" || name === "width" || name === "height" || name === "d" || name === "fill") return;
          if (name === "rel") return;
          // Non-copy attributes to ignore
          if (name === "class" || name === "className") return;
        }
        // Heuristic: ignore CSS/utility-like strings in non-JSX contexts
        if (parent?.type !== "JSXAttribute") {
          const s = String(node.value);
          // Ignore token-y strings without whitespace (e.g., bg-bg, text-foreground)
          if (/^[a-z0-9_:\-\[\]\(\)\/\.]+$/i.test(s)) return;
          if (s.startsWith("/") || /:\/\//.test(s)) return;
          if (/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(s)) return; // MIME types
          if (/^var\(--[a-z0-9\-]+\)$/i.test(s)) return;
          if (/^(hsl|hsla|rgb|rgba)\(/i.test(s)) return;
          if (/var\(/i.test(s)) return;
        }
        if (isWrappedByT(node)) return;
        if (isTrivial(String(node.value))) return;
        context.report({ node, messageId: "hardcodedCopy" });
      },
      JSXText(node: any) {
        if (fileExempt) return;
        const raw = String(node.value ?? node.raw ?? "");
        if (hasExemptComment(context, node)) return;
        const t = raw.replace(/\s+/g, " ").trim();
        if (!t) return;
        // JSXText cannot be wrapped by t() directly here; allow trivial/microcopy only
        if (isTrivial(t)) return;
        context.report({ node, messageId: "hardcodedCopy" });
      },
    } as Rule.RuleListener;
  },
};

export default rule;
