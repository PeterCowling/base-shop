// apps/cms/src/actions/blog.server.ts

import { ensureAuthorized } from "./common/auth";

const projectId = process.env.SANITY_PROJECT_ID as string;
const dataset = process.env.SANITY_DATASET as string;
const apiVersion = process.env.SANITY_API_VERSION || "2021-10-21";
const token = process.env.SANITY_TOKEN;

interface SanityPost {
  _id: string;
  title?: string;
  body?: string;
  published?: boolean;
}

function queryUrl(query: string) {
  return `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
}

async function mutate(body: unknown) {
  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

export async function getPosts(): Promise<SanityPost[]> {
  await ensureAuthorized();
  const res = await fetch(queryUrl('*[_type=="post"]{_id,title,body,published}'), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const json = await res.json();
  return json.result ?? [];
}

export async function getPost(id: string): Promise<SanityPost | null> {
  await ensureAuthorized();
  const res = await fetch(queryUrl(`*[_type=="post" && _id=="${id}"][0]{_id,title,body,published}`), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  const json = await res.json();
  return json.result ?? null;
}

export async function createPost(
  _prev: unknown,
  formData: FormData
): Promise<{ message?: string; error?: string; id?: string }> {
  "use server";
  await ensureAuthorized();
  const title = String(formData.get("title") ?? "");
  const content = String(formData.get("content") ?? "");
  try {
    const res = await mutate({
      mutations: [{ create: { _type: "post", title, body: content, published: false } }],
      returnIds: true,
    });
    const json = await res.json();
    const id = json?.results?.[0]?.id as string | undefined;
    return { message: "Post created", id };
  } catch (err) {
    console.error("Failed to create post", err);
    return { error: "Failed to create post" };
  }
}

export async function updatePost(
  _prev: unknown,
  formData: FormData
): Promise<{ message?: string; error?: string }> {
  "use server";
  await ensureAuthorized();
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "");
  const content = String(formData.get("content") ?? "");
  try {
    await mutate({
      mutations: [{ patch: { id, set: { title, body: content } } }],
    });
    return { message: "Post updated" };
  } catch (err) {
    console.error("Failed to update post", err);
    return { error: "Failed to update post" };
  }
}

export async function publishPost(
  id: string,
  _prev?: unknown,
  _formData?: FormData
): Promise<{ message?: string; error?: string }> {
  "use server";
  await ensureAuthorized();
  try {
    await mutate({
      mutations: [{ patch: { id, set: { published: true } } }],
    });
    return { message: "Post published" };
  } catch (err) {
    console.error("Failed to publish post", err);
    return { error: "Failed to publish post" };
  }
}

export type { SanityPost };
