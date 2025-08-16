import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DATA_FILE = path.join(
  fileURLToPath(new URL("../../..", import.meta.url)),
  "data",
  "blog",
  "posts.json",
);

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  skus: string[];
  publishedAt?: string;
  scheduledAt?: string;
}

function readPosts(): BlogPost[] {
  try {
    const raw = readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw) as BlogPost[];
  } catch {
    return [];
  }
}

function writePosts(posts: BlogPost[]): void {
  writeFileSync(DATA_FILE, JSON.stringify(posts, null, 2));
}

export function createPost(post: BlogPost): void {
  const posts = readPosts();
  posts.push(post);
  writePosts(posts);
}

export function publishScheduledPosts(now: Date = new Date()): void {
  const posts = readPosts();
  let changed = false;
  for (const p of posts) {
    if (
      p.scheduledAt &&
      !p.publishedAt &&
      new Date(p.scheduledAt).getTime() <= now.getTime()
    ) {
      p.publishedAt = now.toISOString();
      changed = true;
    }
  }
  if (changed) writePosts(posts);
}

export function getPublishedPosts(now: Date = new Date()): BlogPost[] {
  publishScheduledPosts(now);
  return readPosts().filter((p) => {
    if (p.publishedAt) return new Date(p.publishedAt).getTime() <= now.getTime();
    return false;
  });
}

export function getPostBySlug(
  slug: string,
  now: Date = new Date(),
): BlogPost | undefined {
  return getPublishedPosts(now).find((p) => p.slug === slug);
}
