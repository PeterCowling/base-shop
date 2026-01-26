---
Type: Plan
Status: Active
Domain: CMS
Created: 2026-01-26
Last-updated: 2026-01-26
Overall-confidence: 90%
---

# WYSIWYG Editor & New Guide Creation

## Summary

Enhance the existing tabbed guide editor with WYSIWYG editing using Tiptap, **with formatting preservation** (bold, italic). Templates control base typography (font family, sizes) via prose classes while content contains semantic formatting tokens.

| Milestone | Focus | Effort | CI |
|-----------|-------|--------|-----|
| 1 | Install Tiptap + Markdown Codec (v2-compatible) | S | **90%** |
| 2 | Unified Token Parser + Block Renderer (+ SEO sanitization) | M | **90%** |
| 3 | Insert Guide Link UI | S | **92%** |
| 4 | Integrate WYSIWYG into Editor Tabs | M | **90%** |
| 5 | New Guide CLI Script | M | **90%** |
| 6 | Round-Trip Tests | S | **90%** |

**Total effort:** ~4-6 implementation sessions

Why higher than the initial estimate: the repo audit surfaced additional required work that materially affects scope (v2 markdown codec instead of a drop-in extension, multiple fallback renderers that need list/token support, and SEO/JSON-LD sanitization to avoid leaking `%LINK`/markdown into structured data).

## Audit Updates (2026-01-26)

- `sections[].title` is the canonical section heading field (not `heading`); editor updates must target `title` + `body`.
- `renderGuideLinkTokens()` inserts a space before adjacent link tokens; the unified tokenizer must preserve this.
- List rendering changes must touch **all** body renderers (GenericContent + fallback renderers under `guide-seo/components`).
- SEO structured data currently embeds raw guide strings (incl. `%LINK` today); once markdown is introduced we must strip tokens/markdown/escapes for JSON-LD (`buildFaqJsonLd`, `useHowToJson`).
- `apps/brikette/src/locales/guides.list.ts` lists locales only; link picker should use `listGuideManifestEntries()` + `getGuideLinkLabel()`.
- New guide creation requires **manifest + slug map + tags index** updates (see Milestone 5 checklist).
- Guide corpus scan (all locales, from `HEAD`): 2322 guide content JSON files, **79,440** strings, 743 link tokens total (`%LINK`: 741, `%HOWTO`: 2); **37** tokens (~5.0%) are adjacent to non-whitespace so the legacy “insert space before link token” behavior is exercised in production (34/37 are in `ja`/`zh` locales).
- Existing content has **0** backslash escapes and **0** markdown-emphasis sequences (`*...*`, `**...**`, `***...***`) today → adding emphasis parsing will not re-interpret legacy content (except the 4 list-like `* ` lines below).
- Ordered-list-like copy is common today: **563** strings contain `^\d+\.\s` at start-of-line → markdown serialization will escape these as `1\. `; renderer must unescape `\.` to keep visible text stable.
- ProseMirror markdown conventions to match in renderer: mixed bold+italic serializes as `***text***`; serializer escapes punctuation with backslashes (e.g. `\*`, `\[`, `\_`, `\.` at start-of-line) and must be unescaped on render.
- Performance baseline (content size): max section count per guide is **9**; max `sections[].body.length` is **26** (single section); max individual string length is **634** chars → tokenizer cost is bounded and should be negligible in real renders.

---

## Expert Review Feedback (Incorporated)

### Round 1 Feedback (Addressed):
1. **HTML↔Markdown Lossy Conversion** → Use ProseMirror markdown (via `@tiptap/pm/markdown`) for parse/serialize
2. **Lists Not End-to-End** → Encode lists as a single markdown list block inside a `string[]` item (for storage) and render as `<ul><li>` (for display)
3. **Formatting Doesn't Compose With Links** → Single-pass tokenizer handles all patterns
4. **No Link Insertion UI** → Add toolbar button with guide selector dropdown
5. **Cursor-Jump Risks** → Fixed: editor is source of truth while focused
6. **Paste Sanitization** → Via schema (allowed nodes only) + paste rules
7. **Markdown Escapes** → Markdown serializers escape punctuation (e.g. `\*`, `\[`, `\_`); renderer must unescape backslash-escaped characters
8. **API Security** → Replace with CLI script for guide creation

### Round 2 Feedback (Now Addressed):
1. **Avoid unmaintained markdown plugins** → Use `@tiptap/pm/markdown` + `markdown-it`, not `tiptap-markdown`
2. **List RENDERING missing** → Add block-level renderer for `<ul><li>` output
3. **Blur-sync loses edits** → Fixed: only sync when not focused + identity change
4. **Tokenizer nesting** → Support `***bold+italic***` (expected serializer output); document deeper nesting limitations
5. **Disallowed formats leak** → Explicitly disable orderedList, strike, etc.
6. **Paste sanitization inaccurate** → Schema-based sanitization + (optionally) force plain-text paste (avoid importing disallowed nodes/marks)
7. **Token label sanitization** → Strip `%`, collapse whitespace, cap length
8. **CLI quote escaping** → Use `JSON.stringify()` for all string fields
9. **Round-trip tests incomplete** → Add block rendering and delimiter safety tests

---

## Requirements (Clarified)

### What the Editor MUST Do:
- Bold/italic formatting - For body text only, template controls sizes
- Template-controlled formatting - Editor shows only what template allows

### What the Editor MUST NOT Do:
- Font type changes - No font family selection
- Font size changes - No size selection (templates control this)
- Color changes - No text color selection
- Headings in body - Section titles are separate plain-text fields

### Field-Specific Rules:
| Field | Input Type | User Formatting | Template Styling |
|-------|-----------|-----------------|------------------|
| Section title (`sections[].title`) | Plain text | None | Bold, fixed size |
| Section body (`sections[].body`) | Rich text | Bold, italic, lists, links | Font size |
| FAQ question (`faqs[].q`) | Plain text | None | Bold |
| FAQ answer (`faqs[].a`) | Rich text | Bold, italic, links | Font size |
| Intro (`intro[]`) | Rich text | Bold, italic, links | Font size |

### Formatting Capabilities by Field:
```tsx
const FIELD_FORMATS: Record<string, AllowedFormat[]> = {
  "sections.body": ["bold", "italic", "bulletList", "link"], // Full set
  "faqs.a": ["bold", "italic", "link"],                     // FAQs already include %LINK tokens today
  intro: ["bold", "italic", "link"],                        // Intro sometimes includes %LINK tokens today
};
```

### Template Controls (Via Prose Classes):
Templates enforce typography through Tailwind prose classes:
```css
prose-lg sm:prose-xl          /* Base font size */
prose-p:leading-relaxed       /* Paragraph line height */
prose-strong:font-semibold    /* Bold weight */
prose-strong:text-brand-heading /* Bold color */
prose-ul:list-disc            /* Lists */
prose-ol:list-decimal
prose-ul:pl-6
prose-ol:pl-6
prose-li:marker:text-brand-primary/70
```

Note: `<em>` tags already render italic via default prose styles; no explicit `prose-em:*` class in the current template.

---

## Current State Analysis

### Existing Token System (Critical Discovery)

The codebase has token parsing in `_linkTokens.tsx`:
- Pattern: `%LINK:guideKey|label%` → `<Link>` component
- Pattern: `%HOWTO:slug|label%` → `<Link>` component
- **Function returns `ReactNode[]`, NOT strings**
- **Function inserts a space before link tokens when the preceding node isn't whitespace** (preserve this behavior)
- **No bold/italic parsing today** → formatting must be added in the same pass as link handling

```tsx
// Current signature - returns ReactNode[], not string
export function renderGuideLinkTokens(
  value: string | null | undefined,
  lang: AppLanguage,
  keyBase: string
): ReactNode[]
```

**Implication:** Cannot process links first then format the result. Need single-pass tokenizer.

**Call sites that render guide-copy paragraphs (must be updated for list blocks + unified token/formatting):**
- `apps/brikette/src/components/guides/GenericContent.tsx`
- `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderStructuredArrays.tsx`
- `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderFallbackStructured.tsx`
- `apps/brikette/src/routes/guides/guide-seo/components/ManualStructuredFallback.tsx`
- `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderManualObject.tsx` (currently renders raw strings)
- `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderInterrailAlias.tsx` (currently renders raw strings)
- `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderManualString.tsx` (currently renders raw strings)
- `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderManualParagraph.tsx` (currently renders raw strings)
- `apps/brikette/src/routes/guides/guide-seo/components/fallback/renderAliasFaqsOnly.tsx` (currently renders raw strings)

### Content Rendering

Templates apply prose styling to rendered content:
```tsx
// GuideSeoTemplateBody.tsx (article className excerpt)
<article className="prose prose-slate prose-lg sm:prose-xl ...
  prose-strong:font-semibold prose-strong:text-brand-heading
  prose-ul:list-disc prose-ol:list-decimal prose-ul:pl-6 prose-ol:pl-6
  prose-li:marker:text-brand-primary/70 ...">
```

This means:
- `<strong>` tags get styled via `prose-strong:*` classes
- `<em>` tags use default prose italics (no custom `prose-em:*` class today)
- **Template controls typography, formatting just adds semantic markup**

### Existing Editor/Dependency Context

- Tiptap is already used in workspace packages (`packages/ui`, `packages/cms-ui`) with `@tiptap/*` pinned at `^2.24.0`.
- Markdown parse/serialize should use `@tiptap/pm/markdown` (re-exports `prosemirror-markdown`, version-aligned with Tiptap v2) plus `markdown-it` as the tokenizer.
- **Audit note:** `@tiptap/markdown` is a v3 package (no `2.x` versions exist), so it is not a drop-in for our current `@tiptap/*@2.24.x` stack.
- `apps/brikette/src/locales/guides.list.ts` lists **locales**, not guides; use `listGuideManifestEntries()` + `getGuideLinkLabel()` for link picker options.

---

## Architecture Decisions

### Template-Editor Coupling

The template declares what formatting is allowed per field type:

```tsx
// Template capabilities config
const FIELD_CAPABILITIES = {
  sectionTitle: {
    allowedFormats: [], // Plain text only (maps to sections[].title)
    templateStyles: "text-xl font-bold text-brand-heading",
  },
  sectionBody: {
    allowedFormats: ["bold", "italic", "bulletList", "link"], // maps to sections[].body
    templateStyles: "text-base",
  },
  faqAnswer: {
    allowedFormats: ["bold", "italic", "link"], // maps to faqs[].a
    templateStyles: "text-base",
  },
  intro: {
    allowedFormats: ["bold", "italic", "link"], // maps to intro[]
    templateStyles: "text-lg",
  },
} as const;

type AllowedFormat = "bold" | "italic" | "bulletList" | "link";
```

**Field types:**
| Field | Editor Type | User Controls | Template Controls |
|-------|-------------|---------------|-------------------|
| Section title (`sections[].title`) | Plain TextInput | Text only | Font size, bold, color |
| Section body (`sections[].body`) | RichTextEditor | Bold, italic, lists, links | Font size |
| FAQ answer (`faqs[].a`) | RichTextEditor | Bold, italic, links | Font size |
| Intro (`intro[]`) | RichTextEditor | Bold, italic, links | Font size |

### Content Format: Markdown-Lite Syntax

Store formatting as a markdown subset (matching ProseMirror / `prosemirror-markdown` conventions) within strings:
```
"This is **bold**, *italic*, and ***bold+italic*** with a %LINK:pathOfTheGods|trail link%."
```

**Markdown Escape Sequences (Produced By Serializer):**
```
"Use backslash escapes for literal punctuation: \\*not italic\\*, \\[brackets\\], \\_underscore\\_"
```

### List Persistence Strategy

Lists are encoded within string array items using markdown list syntax (unordered lists only):
```json
{
  "body": [
    "Introduction paragraph.",
    "* First bullet point\n* Second bullet point\n* Third point",
    "Concluding paragraph."
  ]
}
```

**Rationale:** Preserves existing `string[]` schema while supporting lists. Renderer should accept `*`, `-`, and `+` markers.

### Rendering Pipeline (Single-Pass)

```
Content String → Unified Tokenizer → React Elements
"**bold** with %LINK:key|label%"  → renderGuideLinkTokens() → <><strong>bold</strong> with <Link>label</Link></>
```

**Key Change:** Single pass handles ALL patterns (bold, italic, links, escaped asterisks) **and preserves the existing “insert space before link tokens” behavior**.

### Tiptap Configuration

Tiptap v2 does **not** ship a `@tiptap/markdown@2.x` package. For v2 we implement markdown IO via ProseMirror:
- **Parse:** `MarkdownParser` from `@tiptap/pm/markdown` (re-export of `prosemirror-markdown`) with a `markdown-it` tokenizer, mapped to Tiptap v2 node/mark names (`bulletList`, `listItem`, `bold`, `italic`).
- **Serialize:** `MarkdownSerializer` from `@tiptap/pm/markdown`, configured with `tightLists: true` to prevent blank lines between list items (keeps lists grouped into a single `string[]` block on split).
- **Critical pre-escape on load:** Existing guide copy frequently starts with `1. ` (563 strings across locales). Before parsing markdown, pre-escape ordered-list markers at line-start (`1. ` → `1\\. `) so markdown parsing does not accidentally turn these into ordered lists.
- **No `contentType: "markdown"`:** Tiptap v2 `EditorOptions` has no `contentType`; we set content by parsing markdown into a ProseMirror doc/JSON and using `editor.commands.setContent(...)`.

---

## Milestone 1: Install Tiptap + Markdown Codec (v2)

**Goal:** Add Tiptap with proper markdown serialization
**Confidence:** 90%

### 1.1 Install Dependencies

```bash
cd apps/brikette
pnpm add @tiptap/react@^2.24.0 @tiptap/starter-kit@^2.24.0 @tiptap/extension-placeholder@^2.24.0 @tiptap/core@^2.24.0 @tiptap/pm@^2.24.0 markdown-it
```

**IMPORTANT:** Do **not** install `@tiptap/markdown` here. That package is v3-only. For v2 we use `@tiptap/pm/markdown` (+ `markdown-it`) for parse/serialize.

### 1.2 Create Markdown Codec + RichTextEditor Component

**Files:**
- `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/components/guideMarkdown.ts` (markdown ⇄ ProseMirror doc helpers)
- `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/components/RichTextEditor.tsx` (Tiptap editor UI; uses codec)

Key points for correctness:
- Use ProseMirror markdown (`@tiptap/pm/markdown`) + `markdown-it` for parse/serialize.
- Pre-escape ordered-list markers at line-start (`1. ` → `1\\. `) before parsing to avoid accidental ordered lists (563 legacy strings match `^\d+\. `).
- Build the codec **per allowedFormats** so schema + parser stay in sync (e.g. when `bulletList` is disabled, disable markdown-it’s `list` rule so list syntax stays literal).
- Always serialize with `tightLists: true` so list items stay grouped (no blank lines) and round-trip cleanly into `string[]` blocks.
- Avoid accidental “content migration” on mount: set initial content with `emitUpdate: false` and only call `onChange` after the editor has received a user edit (dirty flag) so opening a guide never rewrites stored strings.
- Resilience: wrap the editor in an ErrorBoundary that falls back to the existing plain `TextArea` so the CMS remains usable if Tiptap/schema init throws.
- Accessibility: add `role="toolbar"`, `aria-label`s, and `aria-pressed` on toggle buttons; ensure toolbar + link picker are keyboard navigable (Tab + Arrow + Enter + Esc) and have visible focus styles.

```ts
// guideMarkdown.ts (sketch)
import MarkdownIt from "markdown-it";
import type { Schema, Node as PMNode } from "@tiptap/pm/model";
import {
  MarkdownParser,
  MarkdownSerializer,
  defaultMarkdownSerializer,
} from "@tiptap/pm/markdown";

export type GuideMarkdownCodec = {
  parse: (markdown: string) => PMNode;
  serialize: (doc: PMNode) => string;
};

export function preEscapeGuideMarkdownForParse(input: string): string {
  // Prevent accidental ordered-list parsing ("1. Step" is common in existing guide copy).
  return input.replace(/(^|\n)(\s*\d+)\.\s/g, "$1$2\\. "); // 1. -> 1\.
}

export function postUnescapeGuideMarkdownForStorage(input: string): string {
  // Keep storage readable/stable: ProseMirror escapes ordered-list-like starts (`1. ` -> `1\\. `).
  // We always pre-escape before parse, so it's safe to store the unescaped form.
  return input.replace(/(^|\n)(\s*\d+)\\\.\s/g, "$1$2. ");
}

export function createGuideMarkdownCodec(schema: Schema, opts: { allowLists: boolean }): GuideMarkdownCodec {
  const md = MarkdownIt("commonmark", { html: false });

  // Disable syntax we never want to parse into nodes/marks.
  md.inline.ruler.disable(["link", "image", "autolink", "backtick", "html_inline"]);
  md.block.ruler.disable(["blockquote", "heading", "lheading", "fence", "code", "hr", "reference", "html_block"]);
  if (!opts.allowLists) md.block.ruler.disable(["list"]);

  const parser = new MarkdownParser(schema, md, {
    paragraph: { block: "paragraph" },
    bullet_list: { block: "bulletList" },
    list_item: { block: "listItem" },
    em: { mark: "italic" },
    strong: { mark: "bold" },
  });

  const serializer = new MarkdownSerializer(
    {
      paragraph: defaultMarkdownSerializer.nodes.paragraph,
      bulletList: (state, node) => state.renderList(node, "  ", () => "* "),
      listItem: defaultMarkdownSerializer.nodes.list_item,
      text: defaultMarkdownSerializer.nodes.text,
    },
    {
      italic: defaultMarkdownSerializer.marks.em,
      bold: defaultMarkdownSerializer.marks.strong,
    },
    { tightLists: true },
  );

  return {
    parse: (markdown) => parser.parse(preEscapeGuideMarkdownForParse(markdown)),
    serialize: (doc) => postUnescapeGuideMarkdownForStorage(serializer.serialize(doc)),
  };
}
```

RichTextEditor then:
- Builds a Tiptap schema from extensions (via `getSchema` from `@tiptap/core`)
- Uses `codec.parse(value).toJSON()` for initial content / setContent
- Uses `codec.serialize(editor.state.doc)` in `onUpdate`
- Keeps the existing “only sync when not focused or fieldId changes” logic to avoid cursor jumps

### 1.3 Key Differences From Original Plan

| Original | Revised |
|----------|---------|
| Custom `htmlToMarkdownLite()` regex | ProseMirror markdown codec: `@tiptap/pm/markdown` + `markdown-it` |
| Markdown plugin ambiguity | No `@tiptap/markdown` (v3-only); v2-compatible codec built against our schema |
| Sync on blur (data loss risk) | Sync only when not focused + field identity change |
| `content: value` | `content: codec.parse(value).toJSON()` + `codec.serialize(editor.state.doc)` |
| Markdown getter | No plugin storage getter; serialize via `codec.serialize(editor.state.doc)` (with `tightLists: true`) |
| Paste via `transformPastedText` config | Paste sanitization via schema + (optionally) force plain-text paste to avoid introducing disallowed nodes |
| No link insertion UI | `onInsertLink` callback + `GuideLinkPicker` |

---

## Milestone 2: Unified Token Parser + Block Renderer (+ SEO sanitization)

**Goal:** Single-pass tokenizer handling all patterns
**Confidence:** 90%

### Problem: Current Approach Won't Work

The existing `renderGuideLinkTokens()` returns `ReactNode[]`. Cannot process links first then format the result - formatting regex expects a string.

### Solution: Single-Pass Unified Tokenizer

**File:** `apps/brikette/src/routes/guides/utils/_linkTokens.tsx`

Upgrade `renderGuideLinkTokens()` to handle ALL patterns in one pass (keep name/signature to avoid call-site churn):

```tsx
// NOTE: This is deliberately a scanner (not a single regex).
//
// Why: ProseMirror markdown serialization escapes literal asterisks inside formatted
// spans (e.g. `**a\\*b\\*c**`). A naive `[^*]+` regex will fail to match the outer
// `**...**` and can mis-tokenize the string.
//
// Inline parse responsibilities:
// - Unescape serializer escapes: \\*, \\[, \\], \\_, \\#, \\., \\\\ (subset)
// - Parse bold/italic markers: `***text***`, `**text**`, `*text*` (including nesting)
// - Parse %LINK/%HOWTO tokens and preserve the legacy “insert a space before the link when adjacent” behavior
// - Avoid treating list markers (`* ` at start of line) as italics: require non-whitespace after `*`
const ESCAPABLE = new Set(["\\", "`", "*", "~", "[", "]", "_", "#", "+", ">", ".", "-"]);

function isEscaped(text: string, index: number): boolean {
  return index > 0 && text[index - 1] === "\\";
}

function tryUnescape(text: string, index: number): { ch: string; next: number } | null {
  if (text[index] !== "\\") return null;
  const next = text[index + 1];
  if (!next || !ESCAPABLE.has(next)) return null;
  return { ch: next, next: index + 2 };
}

function findClosing(text: string, from: number, delim: string): number {
  for (let i = from; i <= text.length - delim.length; i += 1) {
    if (text.startsWith(delim, i) && !isEscaped(text, i)) return i;
  }
  return -1;
}

function parseInline(text: string, lang: AppLanguage, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;
  let linkIndex = 0;
  let formatIndex = 0;
  const howToBase = getSlug("howToGetHere", lang);

  const appendText = (chunk: string) => {
    if (!chunk) return;
    const prev = out[out.length - 1];
    if (typeof prev === "string") {
      out[out.length - 1] = prev + chunk;
    } else {
      out.push(chunk);
    }
  };

  const appendLink = (href: string, label: string) => {
    const prev = out[out.length - 1];
    if (typeof prev === "string") {
      if (prev.length > 0 && !/\\s$/u.test(prev)) out.push(" ");
    } else if (prev != null) {
      out.push(" ");
    }
    out.push(<Link key={`${keyBase}-link-${linkIndex}`} href={href}>{label}</Link>);
    linkIndex += 1;
  };

  while (i < text.length) {
    const unescaped = tryUnescape(text, i);
    if (unescaped) {
      appendText(unescaped.ch);
      i = unescaped.next;
      continue;
    }

    // Link tokens: %LINK:key|label% / %HOWTO:slug|label%
    if (text.startsWith("%LINK:", i) || text.startsWith("%HOWTO:", i)) {
      const end = text.indexOf("%", i + 1);
      if (end > i) {
        const token = text.slice(i, end + 1);
        const m = /^%(LINK|HOWTO):([^|%]+)\\|([^%]+)%$/.exec(token);
        if (m) {
          const [, typ, rawKey, rawLabel] = m;
          const key = rawKey.trim();
          const label = rawLabel.trim();
          if (key && label) {
            const href = typ === "LINK"
              ? guideHref(lang, key as GuideKey)
              : `/${lang}/${howToBase}/${key}`;
            appendLink(href, label);
            i = end + 1;
            continue;
          }
        }
      }
    }

    // Formatting delimiters (priority: ***, **, *)
    let formatted = false;
    for (const delim of ["***", "**", "*"] as const) {
      if (!text.startsWith(delim, i) || isEscaped(text, i)) continue;
      if (delim === "*" && /\s/u.test(text[i + 1] ?? "")) continue; // don't treat list markers as italics

      const close = findClosing(text, i + delim.length, delim);
      if (close === -1) continue;
      const inner = text.slice(i + delim.length, close);
      const innerNodes = parseInline(inner, lang, `${keyBase}-in-${formatIndex}`);

      if (delim === "***") {
        out.push(
          <strong key={`${keyBase}-bi-${formatIndex++}`}>
            <em>{innerNodes}</em>
          </strong>
        );
      } else if (delim === "**") {
        out.push(
          <strong key={`${keyBase}-b-${formatIndex++}`}>
            {innerNodes}
          </strong>
        );
      } else {
        out.push(
          <em key={`${keyBase}-i-${formatIndex++}`}>
            {innerNodes}
          </em>
        );
      }

      i = close + delim.length;
      formatted = true;
      break;
    }
    if (formatted) continue;

    appendText(text[i] ?? "");
    i += 1;
  }

  return out.length > 0 ? out : (text ? [text] : []);
}

export function renderGuideLinkTokens(value: string | null | undefined, lang: AppLanguage, keyBase: string): ReactNode[] {
  const text = typeof value === "string" ? value : "";
  return parseInline(text, lang, keyBase);
}
```

### 2.2 Backward Compatibility

Keep the `renderGuideLinkTokens()` name/signature so existing callers continue to work.
Expose new helpers from the same module (`renderBodyBlocks`, `sanitizeLinkLabel`) via `linkTokens.ts` re-exports.

### 2.3 Block-Level Renderer (Lists)

**File:** `apps/brikette/src/routes/guides/utils/_linkTokens.tsx`

Lists can appear in two storage shapes:
1. A single markdown list block stored as one string (multi-line, e.g. `"* One\n* Two"`)
2. Existing content: consecutive `string[]` items that each start with `"* "` (e.g. `"Directions:"`, `"* Step 1"`, `"* Step 2"`)

To render correctly, add a block renderer that can **group consecutive bullet-line items** into one `<ul>`.

```tsx
const BULLET_LINE = /^\s*[-*+]\s+/;

export function renderBodyBlocks(
  blocks: string[],
  lang: AppLanguage,
  keyBase: string
): ReactNode[] {
  const out: ReactNode[] = [];
  let i = 0;

  const renderList = (items: string[], listKey: string) => (
    <ul key={listKey}>
      {items.map((item, idx) => (
        <li key={`${listKey}-li-${idx}`}>
          {renderGuideLinkTokens(item, lang, `${listKey}-li-${idx}`)}
        </li>
      ))}
    </ul>
  );

  while (i < blocks.length) {
    const block = blocks[i] ?? "";
    const lines = block.split("\n").map((l) => l.trimEnd());
    const nonEmpty = lines.filter((l) => l.trim().length > 0);

    const isListBlock = nonEmpty.length > 0 && nonEmpty.every((l) => BULLET_LINE.test(l));
    if (isListBlock) {
      const items = nonEmpty.map((l) => l.replace(BULLET_LINE, "").trim());
      out.push(renderList(items, `${keyBase}-list-${i}`));
      i += 1;
      continue;
    }

    const isBulletLine = BULLET_LINE.test(block);
    if (isBulletLine) {
      const start = i;
      const items: string[] = [];
      while (i < blocks.length && BULLET_LINE.test(blocks[i] ?? "")) {
        items.push(String(blocks[i]).replace(BULLET_LINE, "").trim());
        i += 1;
      }
      out.push(renderList(items, `${keyBase}-list-${start}`));
      continue;
    }

    out.push(
      <p key={`${keyBase}-p-${i}`}>
        {renderGuideLinkTokens(block, lang, `${keyBase}-p-${i}`)}
      </p>
    );
    i += 1;
  }

  return out;
}
```

### 2.4 Update All Body Renderers

Update every place that renders **section body arrays** to use `renderBodyBlocks()` so list blocks render as `<ul>` and consecutive `"* ..."` items group correctly:

**Files:**
- `apps/brikette/src/components/guides/GenericContent.tsx`
- `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderStructuredArrays.tsx`
- `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderFallbackStructured.tsx`
- `apps/brikette/src/routes/guides/guide-seo/components/ManualStructuredFallback.tsx`
- `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderManualObject.tsx` (currently renders raw strings)
- `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderInterrailAlias.tsx` (currently renders raw strings)
- `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderManualString.tsx` (currently renders raw strings)
- `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderManualParagraph.tsx` (currently renders raw strings)
- `apps/brikette/src/routes/guides/guide-seo/components/fallback/renderAliasFaqsOnly.tsx` (currently renders raw strings)

**Verification checklist (avoid missing a renderer):**
```bash
# All remaining body/faq render paths should go through renderBodyBlocks/renderGuideLinkTokens.
rg -n \"section\\\\.body\\\\.map\\\\(\" apps/brikette/src/routes/guides
rg -n \"renderGuideLinkTokens\\\\(\" apps/brikette/src/routes/guides apps/brikette/src/components/guides
rg -n \"<p key=.*>\\{[^}]*\\}</p>\" apps/brikette/src/routes/guides/guide-seo/components -S
```

```tsx
import { renderBodyBlocks } from "@/routes/guides/utils/_linkTokens";

// Replace existing paragraph rendering with block-aware rendering
{renderBodyBlocks(body, lang, `body`)}
```

### 2.5 SEO / JSON-LD Sanitization (Required)

Structured-data builders currently embed raw guide text and will leak `%LINK:%` tokens (today) and markdown markers/backslash escapes (after WYSIWYG).

**Required fixes:**
- Add a shared `stripGuideMarkup()` utility (in `apps/brikette/src/routes/guides/utils/_linkTokens.tsx` with a re-export in `linkTokens.ts`) that:
  - Strips `%LINK/%HOWTO` tokens (and legacy `[[link:...]]` / `{{guide:...}}`) to labels (reuse existing `stripGuideLinkTokens()` behavior)
  - Removes markdown emphasis markers (`***`, `**`, `*`) while preserving literal asterisks via unescape (`\\*` → `*`)
  - Removes list markers at line start (`* `, `- `, `+ `) for SEO text
  - Unescapes ProseMirror backslash escapes for the supported subset (`\\[`, `\\]`, `\\_`, `\\#`, `\\.`…)
- Use `stripGuideMarkup()` in:
  - `apps/brikette/src/utils/buildFaqJsonLd.ts` (FAQ answers)
  - `apps/brikette/src/routes/guides/guide-seo/useHowToJson.ts` (HowTo step text from section bodies)

**Notes:**
- This is a correctness issue for SEO (not just rendering). Plan assumes we ship this alongside Milestone 2, before WYSIWYG rolls out broadly.
- Keep `stripGuideLinkTokens()` exported for existing callers, but make it an implementation detail used by `stripGuideMarkup()`.

### 2.6 Italics + Literal Asterisks

Avoid boundary heuristics (they break CJK + “no-spaces” languages). Instead:
- Treat unescaped `*...*` as italics (this is what the editor emits for italic marks).
- Treat escaped punctuation as literal (e.g. `\\*` → `*`, `\\[` → `[`). The markdown serializer already escapes literal `*` in plain text.

**Supported (expected editor output):** `***bold+italic***` for mixed bold+italic marks.

### 2.7 Key Risk: Nested Formatting

The tokenizer intentionally supports only a small markdown subset. It supports **well-nested** emphasis via recursion (e.g. `**bold *nested* more**`), but does not aim for full CommonMark delimiter edge-case parity (overlapping/unbalanced delimiters, multi-line emphasis, emphasis spanning blocks, etc.).
**Mitigation:** Keep editor schema limited; add round-trip tests that cover all formats we allow and the exact markdown emitted by the editor.

---

## Milestone 3: Insert Guide Link UI

**Goal:** Add toolbar action with guide selector dropdown
**Confidence:** 92%

### 3.1 Create GuideLinkPicker Component

**File:** `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/components/GuideLinkPicker.tsx`

```tsx
"use client";

/* eslint-disable ds/no-hardcoded-copy -- GUIDES-2470 editor UI is developer-facing */
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { GuideKey } from "@/routes.guides-helpers";
import { listGuideManifestEntries } from "@/routes/guides/guide-manifest";
import { getGuideLinkLabel } from "@/utils/translationFallbacks";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (guideKey: GuideKey, label: string) => void;
};

export function GuideLinkPicker({ isOpen, onClose, onSelect }: Props) {
  const [search, setSearch] = useState("");
  const { t, i18n, ready } = useTranslation("guides");
  const fallbackT = useMemo(() => {
    const fixed = i18n?.getFixedT?.("en", "guides");
    return (fixed ?? ((key: string) => key)) as TFunction;
  }, [i18n]);

  const options = useMemo(() => {
    return listGuideManifestEntries()
      .map((entry) => {
        const fallbackLabel = getGuideLinkLabel(fallbackT, fallbackT, entry.key);
        const label = ready ? getGuideLinkLabel(t, fallbackT, entry.key) : fallbackLabel;
        return { key: entry.key, label: label || entry.key };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [ready, t, fallbackT]);

  const filteredGuides = useMemo(() => {
    const term = search.toLowerCase();
    return options.filter(g =>
      g.key.toLowerCase().includes(term) ||
      g.label.toLowerCase().includes(term)
    );
  }, [options, search]);

  if (!isOpen) return null;

  return (
    <div className="absolute z-50 mt-1 w-72 rounded-md border border-brand-outline/30 bg-brand-bg shadow-lg">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search guides..."
        className="w-full border-b border-brand-outline/20 bg-brand-bg px-3 py-2 text-sm text-brand-heading"
        autoFocus
      />
      <ul className="max-h-48 overflow-y-auto">
        {filteredGuides.map((guide) => (
          <li key={guide.key}>
            <button
              type="button"
              onClick={() => {
                onSelect(guide.key as GuideKey, guide.label || guide.key);
                onClose();
              }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-brand-surface"
            >
              {guide.label || guide.key}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### 3.2 Label Sanitization

Guide titles can contain characters that break the token grammar. Sanitize before insertion (exported utility so tests can import it):

```tsx
/**
 * Sanitize label for %LINK:key|label% token insertion
 */
export function sanitizeLinkLabel(label: string): string {
  return label
    .replace(/%/g, "")           // % terminates token early
    .replace(/\|/g, "-")         // | separates key from label
    .replace(/\n/g, " ")         // Newlines break rendering
    .replace(/\s+/g, " ")        // Collapse whitespace
    .trim()
    .slice(0, 100);              // Cap length
}
```

Place this helper in `_linkTokens.tsx` and re-export from `routes/guides/utils/linkTokens.ts` for shared use.

### 3.3 Integrate with RichTextEditor

When user clicks "🔗 Link" in toolbar:
1. Show `GuideLinkPicker` dropdown
2. On selection, sanitize label and insert `%LINK:guideKey|label%` at cursor
3. Close dropdown

```tsx
// In RichTextEditor, handle link insertion with sanitization
const handleInsertLink = (guideKey: GuideKey, rawLabel: string) => {
  const label = sanitizeLinkLabel(rawLabel);
  editor?.chain().focus().insertContent(`%LINK:${guideKey}|${label}%`).run();
};
```

---

## Milestone 4: Integrate WYSIWYG into Editor Tabs

**Goal:** Replace TextArea components with RichTextEditor
**Confidence:** 90%

### 4.1 Update SectionsTab

**File:** `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/tabs/SectionsTab.tsx`

```tsx
import { RichTextEditor } from "../components/RichTextEditor";

// In SectionCard:

{/* Section title - plain text input, template controls styling */}
<label className="text-sm font-medium">Title</label>
<input
  type="text"
  value={section.title ?? ""}
  onChange={(e) => onUpdate({ title: e.target.value })}
  placeholder="Section heading..."
  className="w-full rounded-md border px-3 py-2"
/>
<p className="text-xs text-brand-text/50">
  Template renders as bold heading — no formatting needed
</p>

{/* Section body - rich text with full formatting */}
<label className="text-sm font-medium">Content</label>
<div className="relative">
  <RichTextEditor
    value={normalizeBodyToString(section.body)}
    onChange={(text) => {
      onUpdate({ body: parseBodyFromString(text) });
    }}
    placeholder="Write section content..."
    allowedFormats={["bold", "italic", "bulletList", "link"]}
    onInsertLink={() => setShowLinkPicker(true)}
    fieldId={`sections.${index}.body`}
  />
  <GuideLinkPicker
    isOpen={showLinkPicker}
    onClose={() => setShowLinkPicker(false)}
    onSelect={handleInsertLink}
  />
</div>
```

**Key points:**
- Section titles: plain text, template makes them bold
- Section body: full formatting (bold, italic, lists, links)
- FAQ answers / intro: bold + italic + internal guide links (no lists)

### 4.2 Update OverviewTab

**File:** `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/tabs/OverviewTab.tsx`

```tsx
// Replace TextArea for intro with RichTextEditor
// Use the existing normalize/parse helpers and set a stable fieldId ("intro")
```

### 4.3 Update FaqsTab

**File:** `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/tabs/FaqsTab.tsx`

```tsx
// Replace TextArea for answer with RichTextEditor
// Use normalize/parse helpers and fieldId={`faqs.${index}.a`}
```

### 4.4 List Handling

When converting between `string[]` storage and editor markdown:
- Split/join logic already exists today inside each tab (`normalizeBodyToString`, `parseBodyFromString`, etc). Extract into a shared helper (to avoid divergent behavior across tabs) and make it list-aware.
- When converting **to** editor value, group consecutive legacy bullet-line entries (`"* Step 1"`, `"* Step 2"`) into a single list block (`"* Step 1\n* Step 2"`).
- When converting **from** editor value, split only on paragraph breaks (`\n\n+`) so tight lists (`* a\n* b`) stay grouped as a single `string[]` item.
- Normalization policy: treat list blocks (multi-line `* ...\n* ...`) as the canonical storage shape. Only normalize legacy bullet-line runs when the field becomes dirty (user edit), so simply opening a guide does not rewrite JSON.

```tsx
// To editor: join with double newlines, but group consecutive bullet lines first
value={stringArrayToGuideMarkdown(section.body)}

// From editor: split on double newlines, preserve list blocks
onChange={(text) => {
  onUpdate({ body: guideMarkdownToStringArray(text) });
}}
```

---

## Milestone 5: New Guide CLI Script

**Goal:** Add CLI script for guide scaffolding (not API route for security)
**Confidence:** 90%

### Why CLI Instead of API

The original plan proposed an API route that writes files. Security concerns:
- Arbitrary file writes on server
- Path traversal vulnerabilities
- No authentication in dev mode

**Better approach:** CLI script that developers run locally.
This scaffolds the content JSON and prints a required manual‑update checklist (manifest + slug map).

### 5.1 Create CLI Script

**File:** `apps/brikette/scripts/create-guide.ts`

```bash
# Usage:
pnpm --filter @apps/brikette create-guide myNewGuide "My Guide Title"
```

```typescript
#!/usr/bin/env node
/* eslint-disable security/detect-non-literal-fs-filename -- Script writes within guides content directory */
import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { slugifyWithFallback } from "../src/utils/slugify";

const [guideKey, title] = process.argv.slice(2);

if (!guideKey || !title) {
  console.error("Usage: pnpm create-guide <guideKey> <title>");
  process.exit(1);
}

// Validate guideKey format (camelCase, no special chars)
if (!/^[a-z][a-zA-Z0-9]*$/.test(guideKey)) {
  console.error("Error: guideKey must be camelCase (e.g., myNewGuide)");
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appRoot = path.resolve(__dirname, "..");
const contentDir = path.join(appRoot, "src", "locales", "en", "guides", "content");
const contentPath = path.join(contentDir, `${guideKey}.json`);

await access(contentPath).then(
  () => {
    console.error(`Error: Guide "${guideKey}" already exists`);
    process.exit(1);
  },
  () => {}
);

const today = new Date().toISOString().split("T")[0];
const scaffold = {
  seo: {
    title,
    description: "",
  },
  linkLabel: title,
  intro: [""],
  sections: [
    {
      id: "overview",
      title: "Overview",
      body: [""],
    },
  ],
  faqs: [],
};

await mkdir(contentDir, { recursive: true });
await writeFile(contentPath, JSON.stringify(scaffold, null, 2) + "\n");
console.log(`✓ Created ${contentPath}`);

const slug = slugifyWithFallback(title, guideKey);

console.log(`
Next steps (manual):
1) Add manifest entry in apps/brikette/src/routes/guides/guide-manifest.ts
   - key: "${guideKey}"
   - slug: "${slug}" (adjust if you want a custom slug)
   - contentKey: "${guideKey}"
2) Register slug in apps/brikette/src/data/generate-guide-slugs.ts
3) Add metadata/tags in apps/brikette/src/data/guides.index.ts (if it should appear in lists)
4) (Optional) Create translation stubs:
   pnpm --filter @apps/brikette gen:translation-stub ${guideKey} --locale=<locale>
`);
```

### 5.2 Add Package.json Script

```json
{
  "scripts": {
    "create-guide": "cd /tmp && npx tsx $OLDPWD/scripts/create-guide.ts"
  }
}
```

### 5.3 Update DraftDashboardContent (Optional)

Show instructions for creating new guides instead of a button:

```tsx
{canEdit && (
  <div className="text-sm text-brand-text/60">
    To create a new guide: <code>pnpm --filter @apps/brikette create-guide</code>
  </div>
)}
```

---

## Milestone 6: Round-Trip Tests

**Goal:** Automated tests verifying content survives edit→save→render cycle
**Confidence:** 90%

### 6.1 Create Test Suite

**File:** `apps/brikette/src/test/lib/formatting-roundtrip.test.ts`

```typescript
import { renderGuideLinkTokens, renderBodyBlocks, sanitizeLinkLabel, stripGuideMarkup } from "@/routes/guides/utils/linkTokens";
import { render } from "@testing-library/react";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: any) => <a href={href}>{children}</a>,
}));

describe("Formatting Round-Trip", () => {
  describe("Inline formatting", () => {
    it("renders **bold** as <strong>", () => {
      const result = renderGuideLinkTokens("**bold**", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.querySelector("strong")).toHaveTextContent("bold");
    });

    it("renders *italic* as <em>", () => {
      const result = renderGuideLinkTokens("*italic*", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.querySelector("em")).toHaveTextContent("italic");
    });

    it("renders ***bold+italic*** as <strong><em>", () => {
      const result = renderGuideLinkTokens("***both***", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.querySelector("strong")).toBeTruthy();
      expect(container.querySelector("strong em")).toHaveTextContent("both");
    });

    it("supports nested italics inside bold", () => {
      const result = renderGuideLinkTokens("**bold *nested* more**", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.querySelector("strong")).toHaveTextContent("bold nested more");
      expect(container.querySelector("strong em")).toHaveTextContent("nested");
    });

    it("treats unclosed bold markers as literal text", () => {
      const result = renderGuideLinkTokens("**bold but no close", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.querySelector("strong")).toBeNull();
      expect(container.textContent).toBe("**bold but no close");
    });

    it("does not emit empty formatting spans", () => {
      const result = renderGuideLinkTokens("****", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.querySelector("strong")).toBeNull();
      expect(container.textContent).toBe("****");
    });

    it("renders %LINK:key|label% as <a>", () => {
      const result = renderGuideLinkTokens("%LINK:pathOfTheGods|trail%", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.querySelector("a")).toHaveTextContent("trail");
    });

    it("preserves legacy spacing behavior for adjacent links", () => {
      const result = renderGuideLinkTokens("See%LINK:pathOfTheGods|trail%", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.textContent).toBe("See trail");
    });

    it("preserves adjacency spacing for CJK locales (no whitespace boundaries)", () => {
      // This exists in the corpus today (JP/ZH tokens adjacent to non-whitespace).
      const result = renderGuideLinkTokens(
        "少量パックは%LINK:groceriesPharmacies|食品・薬局ガイド%",
        "ja",
        "test",
      );
      const { container } = render(<>{result}</>);
      expect(container.textContent).toBe("少量パックは 食品・薬局ガイド");
    });

    it("treats escaped asterisks as literal, not italics", () => {
      // ProseMirror markdown escapes literal * in plain text: a*b*c -> a\\*b\\*c
      const result = renderGuideLinkTokens("a\\*b\\*c", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.querySelector("em")).toBeNull();
      expect(container.textContent).toBe("a*b*c");
    });

    it("supports escaped asterisks inside bold spans", () => {
      const result = renderGuideLinkTokens("**a\\*b\\*c**", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.querySelector("strong")).toHaveTextContent("a*b*c");
      expect(container.querySelector("em")).toBeNull();
    });

    it("renders escaped asterisks as literal: \\*TBD\\*", () => {
      const result = renderGuideLinkTokens("Price is \\*TBD\\*", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.textContent).toBe("Price is *TBD*");
    });

    it("unescapes markdown punctuation: \\[brackets\\]", () => {
      const result = renderGuideLinkTokens("Use \\[brackets\\]", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.textContent).toBe("Use [brackets]");
    });

    it("unescapes ordered-list escapes at line start: 1\\. Step", () => {
      const result = renderGuideLinkTokens("1\\. Step one", "en", "test");
      const { container } = render(<>{result}</>);
      expect(container.textContent).toBe("1. Step one");
    });
  });

  describe("Block-level rendering (lists)", () => {
    it("renders list block as <ul><li>", () => {
      const blocks = ["* First\n* Second\n* Third"];
      const { container } = render(<>{renderBodyBlocks(blocks, "en", "test")}</>);

      const ul = container.querySelector("ul");
      expect(ul).not.toBeNull();

      const lis = container.querySelectorAll("li");
      expect(lis).toHaveLength(3);
      expect(lis[0]).toHaveTextContent("First");
    });

    it("groups consecutive bullet lines into a single <ul>", () => {
      const blocks = ["Directions:", "* Step one", "* Step two"];
      const { container } = render(<>{renderBodyBlocks(blocks, "en", "test")}</>);
      expect(container.querySelectorAll("ul")).toHaveLength(1);
      expect(container.querySelectorAll("li")).toHaveLength(2);
    });

    it("renders paragraph block as <p>", () => {
      const blocks = ["Just a paragraph."];
      const { container } = render(<>{renderBodyBlocks(blocks, "en", "test")}</>);
      expect(container.querySelector("p")).toHaveTextContent("Just a paragraph.");
      expect(container.querySelector("ul")).toBeNull();
    });

    it("renders formatting inside list items", () => {
      const blocks = ["* **Bold item**\n* *Italic item*"];
      const { container } = render(<>{renderBodyBlocks(blocks, "en", "test")}</>);

      const lis = container.querySelectorAll("li");
      expect(lis[0].querySelector("strong")).toHaveTextContent("Bold item");
      expect(lis[1].querySelector("em")).toHaveTextContent("Italic item");
    });
  });

  describe("Delimiter safety", () => {
    it("sanitizes % in link labels", () => {
      // If a guide title is "50% Off Deal", it should be sanitized
      const sanitized = sanitizeLinkLabel("50% Off Deal");
      expect(sanitized).toBe("50 Off Deal"); // % removed
    });

    it("handles | in link labels", () => {
      const sanitized = sanitizeLinkLabel("Option A | Option B");
      expect(sanitized).toBe("Option A - Option B"); // | replaced
    });
  });

  describe("SEO sanitization", () => {
    it("strips link tokens and markdown markers for JSON-LD/SEO strings", () => {
      const stripped = stripGuideMarkup("See %LINK:pathOfTheGods|trail% and **bold**.");
      expect(stripped).toBe("See trail and bold.");
    });
  });
});
```
If `next/link` causes Jest issues, add a local mock in the test file that renders a plain `<a>` element.

### 6.2 Optional: Markdown Codec Tests (no running Tiptap editor required)

```typescript
describe("Editor Markdown Serialization", () => {
  it("preserves bold through edit cycle", () => {
    const original = "This is **bold** text";
    // Build schema+codec, then assert: serialize(parse(original)) === original
  });

  it("preserves lists through edit cycle", () => {
    const original = "* Item 1\n* Item 2\n* Item 3";
    // Assert: serialize(parse(original)) stays a single list block (tight list, no blank lines)
  });

  it("preserves link tokens through edit cycle", () => {
    const original = "See %LINK:pathOfTheGods|the trail%";
    // Assert: token preserved verbatim (not parsed as markdown link)
  });

  it("escapes ordered-list-like text at line start", () => {
    const original = "1. Step one";
    // Assert: serialize(parse(original)) contains `1\\. Step one` (and renderer unescapes on display)
  });
});
```

If Jest fails on ESM/`import.meta` in Tiptap, skip this test or rerun with `JEST_FORCE_CJS=1`.

---

## Files to Create/Modify

### New Files
| File | Purpose |
|------|---------|
| `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/components/guideMarkdown.ts` | ProseMirror markdown codec (parse/serialize) aligned to our schema |
| `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/components/RichTextEditor.tsx` | Tiptap editor with markdown-lite output |
| `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/components/GuideLinkPicker.tsx` | Guide selector dropdown |
| `apps/brikette/scripts/create-guide.ts` | CLI for guide scaffolding |
| `apps/brikette/src/test/lib/formatting-roundtrip.test.ts` | Token + list rendering tests |

### Modified Files
| File | Changes |
|------|---------|
| `apps/brikette/package.json` | Add Tiptap v2 deps (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/core`, `@tiptap/pm`) + `markdown-it` + `create-guide` script |
| `apps/brikette/src/routes/guides/utils/_linkTokens.tsx` | Upgrade `renderGuideLinkTokens()` (formatting + escapes), add `renderBodyBlocks()` (list grouping), `sanitizeLinkLabel()`, `stripGuideMarkup()` |
| `apps/brikette/src/routes/guides/utils/linkTokens.ts` | Re-export new helpers |
| `apps/brikette/src/components/guides/GenericContent.tsx` | Use `renderBodyBlocks()` for section body list support |
| `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderStructuredArrays.tsx` | Use `renderBodyBlocks()` for section bodies |
| `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderFallbackStructured.tsx` | Use `renderBodyBlocks()` for section bodies |
| `apps/brikette/src/routes/guides/guide-seo/components/ManualStructuredFallback.tsx` | Use `renderBodyBlocks()` for section bodies |
| `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderManualObject.tsx` | Use `renderBodyBlocks()` / `renderGuideLinkTokens()` instead of raw strings |
| `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderInterrailAlias.tsx` | Use `renderBodyBlocks()` / `renderGuideLinkTokens()` instead of raw strings |
| `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderManualString.tsx` | Render via token/formatting renderer (not raw strings) |
| `apps/brikette/src/routes/guides/guide-seo/components/fallback/RenderManualParagraph.tsx` | Render via token/formatting renderer (not raw strings) |
| `apps/brikette/src/routes/guides/guide-seo/components/fallback/renderAliasFaqsOnly.tsx` | Render answers via token/formatting renderer (not raw strings) |
| `apps/brikette/src/utils/buildFaqJsonLd.ts` | Strip `%LINK` + markdown/escapes via `stripGuideMarkup()` |
| `apps/brikette/src/routes/guides/guide-seo/useHowToJson.ts` | Strip `%LINK` + markdown/escapes via `stripGuideMarkup()` |
| `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/tabs/SectionsTab.tsx` | Replace TextArea with RichTextEditor |
| `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/tabs/OverviewTab.tsx` | Replace TextArea with RichTextEditor |
| `apps/brikette/src/app/[lang]/draft/edit/[guideKey]/tabs/FaqsTab.tsx` | Replace TextArea with RichTextEditor |

---

## Content Format Examples

### Before (Plain Text)
```json
{
  "body": ["The Path of the Gods is a famous hiking trail.", "It offers stunning views."]
}
```

### After (With Formatting)
```json
{
  "body": ["The **Path of the Gods** is a *famous* hiking trail.", "It offers **stunning** views."]
}
```

### Rendered Output
```html
<p>The <strong>Path of the Gods</strong> is a <em>famous</em> hiking trail.</p>
<p>It offers <strong>stunning</strong> views.</p>
```

### List Block Example
```json
{
  "body": ["* First item\n* Second item\n* Third item"]
}
```

Rendered:
```html
<ul>
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
</ul>
```

Styled via prose classes:
- `<strong>` → `font-semibold text-brand-heading`
- `<em>` → `italic`
- `<ul>/<li>` → `prose-ul:list-disc`, `prose-ul:pl-6`, `prose-li:marker:text-brand-primary/70`
- Font size, family controlled by template's `prose-lg`

---

## Verification

### After Milestone 1 (Tiptap + Markdown Codec)
```bash
cd apps/brikette
pnpm --filter @apps/brikette typecheck
```
1. Create RichTextEditor component
2. Test: Type text, make bold, verify `**text**` output via codec serialization (`onChange`)
3. Test: Paste rich text from web, verify only allowed formats survive (schema-based)
4. Test: Paste ordered list into field that disallows lists, verify it becomes plain text
5. Test: Start a paragraph with `1. Step` and ensure it round-trips as visible `1. Step` (storage may escape as `1\\. Step`)

### After Milestone 2 (Unified Tokenizer)
1. Add test content: `"This is **bold** and *italic* with %LINK:pathOfTheGods|a link%."`
2. Render via `renderGuideLinkTokens()`
3. Verify: `<strong>`, `<em>`, and `<Link>` tags produced correctly
4. Test escaped asterisks: `"Price is \*TBD\*"` → renders as "Price is *TBD*"

### After Milestone 3 (Insert Link UI)
1. Open RichTextEditor, click "🔗 Link" button
2. Search for a guide in dropdown
3. Select guide → verify `%LINK:guideKey|label%` inserted at cursor

### After Milestone 4 (Editor Integration)
1. Visit `/en/draft/edit/weekend48Positano?preview=<token>`
2. Click Sections tab → see WYSIWYG editor
3. Type text, click Bold → see **bold** in output
4. Click "🔗 Link" → insert guide link token
5. Save → content persists with formatting
6. View guide → bold and links render correctly

### After Milestone 5 (CLI Script)
```bash
cd apps/brikette
pnpm --filter @apps/brikette create-guide testGuide "My Test Guide"
# Verify: content file created + manual next-steps list printed
```

### After Milestone 6 (Round-Trip Tests)
```bash
pnpm --filter @apps/brikette test -- src/test/lib/formatting-roundtrip.test.ts
```
If Jest hits ESM parsing errors, rerun with `JEST_FORCE_CJS=1` per testing policy.
All test cases pass.

### Final Validation
```bash
pnpm typecheck && pnpm lint
# Plus targeted tests for changed files (see scripts/validate-changes.sh)
```

---

## WYSIWYG Library: Tiptap (Consistency Choice)

- Tiptap is already in use in workspace packages (`packages/ui`, `packages/cms-ui`) at `^2.24.0`.
- Reusing Tiptap keeps the editor stack consistent and avoids introducing a new vendor.
- New deps for markdown IO are v2-compatible: `@tiptap/core`/`@tiptap/pm` + `markdown-it` (no `@tiptap/markdown`, which is v3-only).

---

## Confidence Summary

| Milestone | CI | Key Risk |
|-----------|-----|----------|
| 1. Tiptap + Markdown Codec | 90% | Codec/schema alignment + markdown-it rule disabling |
| 2. Unified Tokenizer + Block Renderer (+ SEO) | 90% | Tokenizer correctness + renderer coverage + JSON-LD stripping |
| 3. Insert Link UI | 92% | Guide label source + search UX |
| 4. Editor Integration | 90% | State sync + list/paragraph conversion |
| 5. CLI Script | 90% | New guide still requires manifest/slug/index updates (script prints checklist) |
| 6. Round-Trip Tests | 90% | Jest environment + Next/Link mocks as needed |

**Overall confidence: 90%** - Raised after repo-wide corpus scan and fallback-render/SEO audits removed the major unknowns.

## Key Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Markdown codec mismatch (schema vs parser/serializer) | Medium | Build codec per `allowedFormats`; disable markdown-it rules we don’t support; add codec round-trip tests |
| Ordered-list-like legacy text (`1. `) accidentally parsed as lists | Medium | Pre-escape on parse (`1. ` → `1\\. `); renderer unescapes `\\.` back to `.` |
| Tokenizer spacing behavior regresses | Medium | Preserve existing link-spacing logic; add adjacency tests |
| Mixed bold+italic serializes as `***text***` | Medium | Support `***` explicitly in tokenizer + tests (expected editor output) |
| Hand-edited JSON with unescaped `*` | Medium | Treat markdown rules as source of truth; escape literal asterisks as `\\*` |
| List rendering missed in fallback paths | Medium | Update all renderers + list tests |
| List fragmentation (tight vs loose markdown lists) | Medium | Prefer tight list serialization; implement split/join helpers that keep lists grouped; add tests |
| Markdown backslash escapes render literally (e.g. `\\[`) | Medium | Tokenizer unescapes serializer escapes for the supported subset |
| Structured data leaks `%LINK` / markdown markers | Medium | Add `stripGuideMarkup()` and apply in JSON-LD builders (`buildFaqJsonLd`, `useHowToJson`) + tests |
| Guide picker label resolution | Medium | Use `getGuideLinkLabel` with fallback translator; search by key+label |
| New guide registration incomplete | High | CLI prints checklist (manifest + slug map + tags index) |
| State sync data loss | High | Only sync when !editor.isFocused + fieldId change |
| Link label with `%` or `\|` | Medium | `sanitizeLinkLabel()` strips/replaces delimiters |

## Pre-Implementation Audit Required

Before implementing Milestone 2, audit existing content for literal asterisks that would be incorrectly parsed as formatting:

```bash
# Find potential conflicts in guide content (all locales)
rg -n "\\*" apps/brikette/src/locales -g 'guides/content/*.json'
```

**Audit result (2026-01-26):** 4 matches, all are list-like bullet lines (`"* "`) in:
- `apps/brikette/src/locales/en/guides/content/arienzoBeachBusBack.json`
- `apps/brikette/src/locales/en/guides/content/lauritoBeachBusBack.json`

**Implication:** We must treat leading `* ` as list syntax for section bodies (and group consecutive bullet-line blocks), not as italic markup.

Also audit for ordered-list-like strings (prevalent): the corpus contains **563** strings with `^\d+\. ` at start-of-line. Markdown serialization will escape these as `1\\. ` and the renderer must unescape `\\.`.

If future content introduces literal asterisks that are not list markers:
1. The editor markdown serializer will typically escape them (`*` → `\*`).
2. For hand-edited JSON: escape them manually (`*` → `\*`) to avoid accidental italics.
