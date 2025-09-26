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
    attrName === "title" ||
    attrName === "alt" ||
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
  return all.some((c: any) => {
    const text = String(c.value || "");
    if (!/i18n-exempt/.test(text)) return false;
    const endLine = c.loc?.end?.line ?? 0;
    return endLine === startLine || endLine === startLine - 1;
  });
}

function isTrivial(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  if (t.length <= 12) return true;
  const lower = t.toLowerCase();
  if (MICROCOPY.has(lower)) return true;
  // Very short with punctuation-only endings
  if (/^[\p{L}\p{N} ,.!?'"-]{1,12}$/u.test(t)) return true;
  return false;
}

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: { description: "Disallow hardcoded copy; require i18n wrappers.", recommended: false },
    schema: [],
    messages: {
      hardcodedCopy: "Hardcoded copy detected. Wrap in t()/useTranslations() or add // i18n-exempt with justification.",
    },
  },
  create(context) {
    return {
      Literal(node: any) {
        if (typeof node.value !== "string") return;
        if (hasExemptComment(context, node)) return;
        // Ignore within allowed a11y attributes
        const parent = node.parent;
        if (parent?.type === "JSXAttribute") {
          const name = parent.name?.name as string | undefined;
          if (isA11yAttr(name)) return;
        }
        if (isWrappedByT(node)) return;
        if (isTrivial(String(node.value))) return;
        context.report({ node, messageId: "hardcodedCopy" });
      },
      JSXText(node: any) {
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
