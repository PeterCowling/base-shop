// apps/cms/src/app/cms/blog/posts/PostForm.client.tsx
"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import { Button, Input, Textarea, Toast } from "@ui";
import { PRODUCTS } from "@/lib/products";

export interface FormState {
  message?: string;
  error?: string;
  id?: string;
}

interface Props {
  action: (_state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  post?: { _id?: string; title?: string; body?: string; slug?: string; excerpt?: string };
}

export default function PostForm({ action, submitLabel, post }: Props) {
  const [state, formAction] = useFormState(action, { message: "", error: "" });
  const [content, setContent] = useState(
    Array.isArray(post?.body)
      ? JSON.stringify(post?.body, null, 2)
      : post?.body ?? "[]",
  );
  const [query, setQuery] = useState("");
  const matches = PRODUCTS.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase()),
  ).slice(0, 5);

  function insertProduct(slug: string) {
    let blocks: unknown[] = [];
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) blocks = parsed;
    } catch {
      blocks = [];
    }
    blocks.push({ _type: "productReference", slug });
    setContent(JSON.stringify(blocks, null, 2));
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4 max-w-xl">
        <Input name="title" label="Title" defaultValue={post?.title ?? ""} required />
        <Input name="slug" label="Slug" defaultValue={post?.slug ?? ""} required />
        <Textarea name="excerpt" label="Excerpt" defaultValue={post?.excerpt ?? ""} />
        <div className="space-y-2">
          <Textarea
            name="content"
            label="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px]"
          />
          <div className="space-y-1">
            <Input
              label="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <ul className="space-y-1">
                {matches.map((p) => (
                  <li key={p.slug}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => insertProduct(p.slug)}
                    >
                      {p.title}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {post?._id && <input type="hidden" name="id" value={post._id} />}
        <Button type="submit">{submitLabel}</Button>
      </form>
      <Toast
        open={Boolean(state.message || state.error)}
        message={state.message || state.error || ""}
      />
    </div>
  );
}
