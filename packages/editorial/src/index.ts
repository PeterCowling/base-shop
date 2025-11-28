import * as fs from "node:fs/promises";
import * as path from "node:path";
import type { Shop } from "@acme/types";
import { DATA_ROOT } from "@platform-core/dataRoot";

// Lightweight front‑matter parser for scaffolding. Expects YAML‑like key: value
// pairs delimited by leading and trailing '---' lines.
function parseFrontMatter(src: string): { data: Record<string, string>; body: string } {
  const lines = src.split(/\r?\n/);
  if (lines[0] !== "---") return { data: {}, body: src };
  const data: Record<string, string> = {};
  let i = 1;
  for (; i < lines.length; i++) {
    const line = lines[i]!
      // Trim BOM or zero‑width chars that can sneak into pasted content
      .replace(/^\uFEFF/, "")
      .trim();
    if (line === "---") { i++; break; }
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) {
      const [, k, v] = m;
      // Strip wrapping quotes if present
      const val = v.replace(/^"|"$/g, "").replace(/^'|'$/g, "");
      data[k] = val;
    }
  }
  const body = lines.slice(i).join("\n");
  return { data, body };
}

export interface EditorialPost {
  title: string;
  slug: string;
  excerpt?: string;
  body?: string; // raw MDX for scaffolding; future: compile to React
  author?: string;
  categories?: string[];
  products?: string[];
  date?: string;
}

function getPostsDir(shopId: string) {
  return path.join(DATA_ROOT, shopId, "blog");
}

async function readFileSafe(file: string): Promise<string | null> {
  try { return await fs.readFile(file, "utf8"); } catch { return null; }
}

export async function fetchPublishedPosts(shopId: string): Promise<EditorialPost[]> {
  const dir = getPostsDir(shopId);
  let entries: string[] = [];
  try {
    const ls = await fs.readdir(dir, { withFileTypes: true });
    entries = ls.filter((e) => e.isFile() && /\.(md|mdx)$/i.test(e.name)).map((e) => e.name);
  } catch {
    return [];
  }
  const posts: EditorialPost[] = [];
  for (const name of entries) {
    const file = path.join(dir, name);
    const src = await readFileSafe(file);
    if (!src) continue;
    const { data, body } = parseFrontMatter(src);
    const title = data.title || name.replace(/\.(md|mdx)$/i, "");
    const slug = (data.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const excerpt = data.excerpt || body.slice(0, 160).replace(/\s+/g, " ").trim();
    const categories = typeof data.categories === "string" && data.categories.trim()
      ? data.categories.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    const products = typeof data.products === "string" && data.products.trim()
      ? data.products.split(",").map((s) => s.trim()).filter(Boolean)
      : undefined;
    const date = typeof data.date === "string" && data.date.trim() ? data.date.trim() : undefined;
    posts.push({ title, slug, excerpt, categories, products, date });
  }
  // Sort by date desc when provided
  posts.sort((a, b) => {
    const ad = a.date ? Date.parse(a.date) : 0;
    const bd = b.date ? Date.parse(b.date) : 0;
    return bd - ad;
  });
  return posts;
}

export async function fetchPostBySlug(shopId: string, slug: string): Promise<EditorialPost | null> {
  const dir = getPostsDir(shopId);
  let entries: string[] = [];
  try {
    const ls = await fs.readdir(dir, { withFileTypes: true });
    entries = ls.filter((e) => e.isFile() && /\.(md|mdx)$/i.test(e.name)).map((e) => e.name);
  } catch {
    return null;
  }
  for (const name of entries) {
    const file = path.join(dir, name);
    const src = await readFileSafe(file);
    if (!src) continue;
    const { data, body } = parseFrontMatter(src);
    const title = data.title || name.replace(/\.(md|mdx)$/i, "");
    const candidateSlug = (data.slug || title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (candidateSlug === slug) {
      const excerpt = data.excerpt || body.slice(0, 160).replace(/\s+/g, " ").trim();
      const categories = typeof data.categories === "string" && data.categories.trim()
        ? data.categories.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
      const products = typeof data.products === "string" && data.products.trim()
        ? data.products.split(",").map((s) => s.trim()).filter(Boolean)
        : undefined;
      const date = typeof data.date === "string" && data.date.trim() ? data.date.trim() : undefined;
      const author = typeof data.author === "string" && data.author.trim() ? data.author.trim() : undefined;
      return { title, slug: candidateSlug, excerpt, body, categories, products, date, author };
    }
  }
  return null;
}

export type { Shop };

export async function renderMarkdownToHtml(markdown: string): Promise<string> {
  const { unified } = await import('unified');
  const remarkParse = (await import('remark-parse')).default;
  const remarkGfm = (await import('remark-gfm')).default;
  const remarkRehype = (await import('remark-rehype')).default;
  const rehypeStringify = (await import('rehype-stringify')).default;
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .process(markdown);
  return String(file);
}
