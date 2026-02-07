import type { Rule } from "eslint";

interface RuleOptions {
  /** Regex patterns to ignore (matched against string value) */
  ignorePatterns?: string[];
  /** Property names where string values are always ignored (e.g., displayName) */
  ignoreProperties?: string[];
}

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

/** Common CSS utility helper function names */
const CSS_HELPER_FUNCTIONS = new Set(["cn", "clsx", "classnames", "cx", "cva", "tv"]);

/** Check if a string looks like CSS utility classes (space-separated kebab-case tokens) */
function looksLikeCssClasses(value: string): boolean {
  const tokens = value.trim().split(/\s+/);
  // Must have at least one token
  if (tokens.length === 0) return false;
  // Each token should look like a CSS utility class (kebab-case, may include modifiers like hover:, md:, etc.)
  // Pattern: optional modifiers (word:) followed by kebab-case identifiers with optional brackets/parentheses
  const cssTokenPattern = /^(?:[a-z0-9_\-\[\]=]+:)*[a-z0-9_\-\[\]\(\)\/\.!]+$/i;
  return tokens.every((token) => cssTokenPattern.test(token));
}

function hasUtilityClassSyntax(value: string): boolean {
  const tokens = value.trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 2) return false;
  return tokens.some((token) => /[:\-\/\[\]\(\)\.!]/.test(token));
}

/** Check if node is inside a CSS helper function call like cn(), clsx(), etc. */
function isInsideCssHelper(node: any): boolean {
  let p: any = node.parent;
  while (p) {
    if (p.type === "CallExpression") {
      const callee = p.callee;
      if (callee?.type === "Identifier" && CSS_HELPER_FUNCTIONS.has(callee.name)) {
        return true;
      }
    }
    // Don't traverse past function boundaries
    if (p.type === "FunctionExpression" || p.type === "ArrowFunctionExpression" || p.type === "FunctionDeclaration") {
      break;
    }
    p = p.parent;
  }
  return false;
}

function isConsoleCallStringLiteral(node: any): boolean {
  const parent = node.parent;
  if (!parent || parent.type !== "CallExpression") return false;
  const { callee } = parent;
  if (!callee || callee.type !== "MemberExpression") return false;
  if (callee.object?.type !== "Identifier" || callee.object.name !== "console") return false;
  const method = callee.property?.type === "Identifier" ? callee.property.name : null;
  if (!method) return false;
  return ["log", "info", "warn", "error", "debug"].includes(method);
}

function isErrorMessageLiteral(node: any): boolean {
  const parent = node.parent;
  if (!parent) return false;
  if (parent.type !== "CallExpression" && parent.type !== "NewExpression") return false;
  const callee = parent.callee;
  if (!callee || callee.type !== "Identifier" || callee.name !== "Error") return false;
  const args = parent.arguments ?? [];
  return args[0] === node;
}

/** Default properties that are always non-user-facing */
const DEFAULT_IGNORE_PROPERTIES = new Set([
  "displayName", // React component displayName
  "name",        // Function/class name assignments
]);

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow hardcoded copy; require i18n wrappers.",
      recommended: false,
      // Repo doc with concrete steps for adding keys and wiring t()
      url: "docs/i18n/add-translation-keys.md",
    },
    schema: [
      {
        type: "object",
        properties: {
          ignorePatterns: {
            type: "array",
            items: { type: "string" },
            description: "Regex patterns to ignore (matched against string value)",
          },
          ignoreProperties: {
            type: "array",
            items: { type: "string" },
            description: "Additional property names where string values are always ignored",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      hardcodedCopy:
        "Hardcoded copy detected. Move text into packages/i18n/src/<locale>.json and reference via t('key'). See docs/i18n/add-translation-keys.md. Exemptions are tech debt and only for non‑UI strings — they must include a ticket (// i18n-exempt -- ABC-123 [ttl=YYYY-MM-DD]) or they will be ignored.",
    },
  },
  create(context) {
    const options: RuleOptions = context.options[0] ?? {};
    const ignorePatternRegexes = (options.ignorePatterns ?? []).map((p) => new RegExp(p));
    const ignoreProperties = new Set([
      ...DEFAULT_IGNORE_PROPERTIES,
      ...(options.ignoreProperties ?? []),
    ]);

    const filename = typeof context.getFilename === "function" ? context.getFilename() : "";
    // Declaration files contain many non-copy string literals (keys, unions) and
    // shouldn't be treated as user-facing copy.
    if (filename.endsWith(".d.ts")) {
      return {};
    }

    const sc = (context as any).sourceCode || context.getSourceCode();
    const EXEMPT_FILE_RE = /i18n-exempt\s+file\s*--\s*([A-Z]{2,}-\d+)(?:[^\S\r\n]+ttl=\d{4}-\d{2}-\d{2})?/;
    const fileExempt = (sc.getAllComments?.() ?? []).some((c: any) => EXEMPT_FILE_RE.test(String(c.value || "")));

    function isIgnoredByPattern(value: string): boolean {
      return ignorePatternRegexes.some((re) => re.test(value));
    }

    function isIgnoredPropertyAssignment(node: any): boolean {
      const parent = node.parent;
      // Check for: Component.displayName = "Component"
      if (parent?.type === "AssignmentExpression" && parent.left?.type === "MemberExpression") {
        const propName = parent.left.property?.name;
        if (propName && ignoreProperties.has(propName)) return true;
      }
      // Check for: { displayName: "Component" }
      if (parent?.type === "Property" && parent.key?.type === "Identifier") {
        const propName = parent.key.name;
        if (propName && ignoreProperties.has(propName)) return true;
      }
      return false;
    }

    function shouldIgnoreLiteral(node: any, strValue: string): boolean {
      // Check configurable ignore patterns
      if (isIgnoredByPattern(strValue)) return true;

      // Check if this is a property assignment we should ignore
      if (isIgnoredPropertyAssignment(node)) return true;

      const p = node.parent;
      // Ignore directive prologues like "use client", "use server", "use strict"
      if (p?.type === "ExpressionStatement" && (p as any).directive) return true;

      // Ignore module specifiers in import/export declarations
      if (
        p?.type === "ImportDeclaration" ||
        p?.type === "ExportAllDeclaration" ||
        (p?.type === "ExportNamedDeclaration" && (p as any).source)
      ) {
        return true;
      }

      // Ignore log messages; these are not user-facing UI copy and are often
      // intentionally stable for diagnostics.
      if (isConsoleCallStringLiteral(node)) return true;

      // Ignore Error(...) / new Error(...) messages (these are generally developer-facing).
      if (isErrorMessageLiteral(node)) return true;

      if (hasExemptComment(context, node)) return true;

      // Ignore within allowed a11y attributes
      if (p?.type === "JSXAttribute") {
        const name = p.name?.name as string | undefined;
        if (isA11yAttr(name)) return true;
        // Non-user-facing attribute literals
        if (name === "role") return true;
        if (name === "href") return true;
        if (name === "viewBox" || name === "width" || name === "height" || name === "d" || name === "fill")
          return true;
        if (name === "rel") return true;
        // Non-copy attributes to ignore
        if (name === "class" || name === "className") return true;
      }

      // Heuristic: ignore CSS/utility-like strings in non-JSX contexts
      if (p?.type !== "JSXAttribute") {
        // Ignore token-y strings without whitespace (e.g., bg-bg, text-foreground)
        if (/^[a-z0-9_:\-\[\]\(\)\/\.]+$/i.test(strValue)) return true;
        if (strValue.startsWith("/") || /:\/\//.test(strValue)) return true;
        if (/^[a-z0-9.+-]+\/[a-z0-9.+-]+$/i.test(strValue)) return true; // MIME types
        if (/^var\(--[a-z0-9\-]+\)$/i.test(strValue)) return true;
        if (/^(hsl|hsla|rgb|rgba)\(/i.test(strValue)) return true;
        if (/var\(/i.test(strValue)) return true;
        // Ignore space-separated CSS class strings inside cn(), clsx(), etc.
        if (isInsideCssHelper(node) && looksLikeCssClasses(strValue)) return true;
        // Also ignore obvious CSS utility class lists stored in constants.
        if (looksLikeCssClasses(strValue) && hasUtilityClassSyntax(strValue)) return true;
      }

      if (isWrappedByT(node)) return true;
      if (isTrivial(strValue)) return true;

      return false;
    }

    return {
      Literal(node: any) {
        if (fileExempt) return;
        if (typeof node.value !== "string") return;
        const strValue = String(node.value);
        if (shouldIgnoreLiteral(node, strValue)) return;
        context.report({ node, messageId: "hardcodedCopy" });
      },
      JSXText(node: any) {
        if (fileExempt) return;
        const raw = String(node.value ?? node.raw ?? "");
        if (hasExemptComment(context, node)) return;
        const t = raw.replace(/\s+/g, " ").trim();
        if (!t) return;
        // Check configurable ignore patterns
        if (isIgnoredByPattern(t)) return;
        // JSXText cannot be wrapped by t() directly here; allow trivial/microcopy only
        if (isTrivial(t)) return;
        context.report({ node, messageId: "hardcodedCopy" });
      },
    } as Rule.RuleListener;
  },
};

export default rule;
