import { NextResponse } from "next/server";
import {
  createPost,
  getPublishedPosts,
} from "@acme/blog";

export async function GET() {
  const posts = getPublishedPosts(new Date());
  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const data = await req.json();
  createPost({
    id: data.id,
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    content: data.content,
    skus: Array.isArray(data.skus) ? data.skus : [],
    publishedAt: data.publishedAt,
    scheduledAt: data.scheduledAt,
  });
  return NextResponse.json({ ok: true });
}
