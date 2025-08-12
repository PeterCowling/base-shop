// apps/cms/src/app/cms/blog/posts/PostForm.client.tsx
"use client";

import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { Button, Input, Switch, Textarea, Toast } from "@ui";
import { slugify } from "@acme/shared-utils";
import type { SKU } from "@acme/types";
import {
  EditorProvider,
  PortableTextEditable,
  PortableTextEditor,
  useEditor,
  defineSchema,
  type PortableTextBlock,
} from "@portabletext/editor";
import { EventListenerPlugin } from "@portabletext/editor/plugins";
import { PortableText } from "@portabletext/react";

export interface FormState {
  message?: string;
  error?: string;
  id?: string;
}

interface Props {
  action: (_state: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  post?: {
    _id?: string;
    title?: string;
    body?: string;
    slug?: string;
    excerpt?: string;
    publishedAt?: string;
  };
}

const schema = defineSchema({
  decorators: [{ name: "strong" }, { name: "em" }],
  styles: [
    { name: "normal" },
    { name: "h1" },
    { name: "h2" },
    { name: "h3" },
  ],
  lists: [{ name: "bullet" }, { name: "number" }],
  annotations: [
    {
      name: "link",
      type: "object",
      fields: [{ name: "href", type: "string" }],
    },
  ],
  inlineObjects: [],
  blockObjects: [
    {
      name: "productReference",
      type: "object",
      fields: [{ name: "slug", type: "string" }],
    },
    {
      name: "embed",
      type: "object",
      fields: [{ name: "url", type: "string" }],
    },
  ],
});

function ProductPreview({ slug }: { slug: string }) {
  const [product, setProduct] = useState<SKU | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error("Failed to load product");
        const data: SKU = await res.json();
        if (active) {
          setProduct(data);
          setError(null);
        }
      } catch {
        if (active) setError("Failed to load product");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <div className="border p-2">Loading…</div>;
  if (error || !product)
    return <div className="border p-2 text-red-500">{error ?? "Not found"}</div>;
  const available = (product.stock ?? 0) > 0;
  return (
    <div className="flex gap-2 border p-2">
      {product.image && (
        <img
          src={product.image}
          alt={product.title}
          className="h-16 w-16 object-cover"
        />
      )}
      <div className="space-y-1">
        <div className="font-semibold">{product.title}</div>
        <div>{(product.price / 100).toFixed(2)}</div>
        <div className="text-sm">
          {available ? "In stock" : "Out of stock"}
        </div>
      </div>
    </div>
  );
}

const previewComponents = {
  types: {
    productReference: ({ value }: any) => <ProductPreview slug={value.slug} />,
    embed: ({ value }: any) => (
      <div className="aspect-video">
        <iframe src={value.url} className="h-full w-full" />
      </div>
    ),
  },
  marks: {
    link: ({ children, value }: any) => (
      <a
        href={value.href}
        className="text-blue-600 underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
  },
  block: {
    h1: ({ children }: any) => <h1>{children}</h1>,
    h2: ({ children }: any) => <h2>{children}</h2>,
    h3: ({ children }: any) => <h3>{children}</h3>,
  },
};

function Toolbar() {
  const editor = useEditor();
  const addLink = () => {
    const href = prompt("URL");
    if (!href) return;
    if (PortableTextEditor.isAnnotationActive(editor, "link")) {
      PortableTextEditor.removeAnnotation(editor, "link");
    }
    PortableTextEditor.addAnnotation(editor, "link", { href });
  };
  const addEmbed = () => {
    const url = prompt("Embed URL");
    if (url) PortableTextEditor.insertBlock(editor, "embed", { url });
  };
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => PortableTextEditor.toggleMark(editor, "strong")}
      >
        Bold
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => PortableTextEditor.toggleMark(editor, "em")}
      >
        Italic
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => PortableTextEditor.toggleBlockStyle(editor, "h1")}
      >
        H1
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => PortableTextEditor.toggleBlockStyle(editor, "h2")}
      >
        H2
      </Button>
      <Button type="button" variant="outline" onClick={addLink}>
        Link
      </Button>
      <Button type="button" variant="outline" onClick={addEmbed}>
        Embed
      </Button>
    </div>
  );
}

function ProductSearch({
  query,
  setQuery,
}: {
  query: string;
  setQuery: (v: string) => void;
}) {
  const editor = useEditor();
  const [matches, setMatches] = useState<SKU[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setMatches([]);
      setError(null);
      return;
    }
    const handle = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Failed to load products");
        const data: SKU[] = await res.json();
        setMatches(data);
        setError(null);
      } catch {
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="space-y-1">
      <Input
        label="Search products"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading && <div>Loading…</div>}
      {error && <div className="text-red-500">{error}</div>}
      {query && !loading && !error && (
        <ul className="space-y-1">
          {matches.map((p) => (
            <li key={p.slug}>
              <Button
                type="button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() =>
                  PortableTextEditor.insertBlock(editor, "productReference", {
                    slug: p.slug,
                  })
                }
              >
                {p.image && (
                  <img
                    src={p.image}
                    alt={p.title}
                    className="h-8 w-8 object-cover"
                  />
                )}
                <span className="flex-1 text-left">{p.title}</span>
                <span className="text-sm">
                  {(p.price / 100).toFixed(2)}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PostForm({ action, submitLabel, post }: Props) {
  const [state, formAction] = useFormState(action, { message: "", error: "" });
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [editSlug, setEditSlug] = useState(false);
  useEffect(() => {
    if (!editSlug) setSlug(slugify(title));
  }, [title, editSlug]);
  const [publishedAt, setPublishedAt] = useState(
    post?.publishedAt ? post.publishedAt.slice(0, 16) : "",
  );
  const [content, setContent] = useState<PortableTextBlock[]>(
    Array.isArray(post?.body)
      ? (post?.body as PortableTextBlock[])
      : typeof post?.body === "string"
        ? JSON.parse(post.body)
        : [],
  );
  const [query, setQuery] = useState("");

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4 max-w-xl">
        <Input
          name="title"
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div className="space-y-2">
          <Input
            name="slug"
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={!editSlug}
            required
          />
          <div className="flex items-center gap-2">
            <Switch
              id="edit-slug"
              checked={editSlug}
              onChange={(e) => setEditSlug(e.target.checked)}
            />
            <label htmlFor="edit-slug">Edit slug</label>
          </div>
        </div>
        <Textarea name="excerpt" label="Excerpt" defaultValue={post?.excerpt ?? ""} />
        <Input
          type="datetime-local"
          name="publishedAt"
          label="Publish at"
          value={publishedAt}
          onChange={(e) => setPublishedAt(e.target.value)}
        />
        <div className="space-y-2">
          <EditorProvider
            initialConfig={{ schemaDefinition: schema, initialValue: content }}
          >
            <EventListenerPlugin
              on={(event) => {
                if (event.type === "mutation") {
                  setContent(event.value as PortableTextBlock[]);
                }
              }}
            />
            <Toolbar />
            <PortableTextEditable className="min-h-[200px] rounded border p-2" />
            <ProductSearch query={query} setQuery={setQuery} />
          </EditorProvider>
        </div>
        <input
          type="hidden"
          name="content"
          value={JSON.stringify(content)}
        />
        {post?._id && <input type="hidden" name="id" value={post._id} />}
        <Button type="submit">{submitLabel}</Button>
      </form>
      <input
        type="hidden"
        name="publishedAt"
        form="publish-form"
        value={publishedAt}
      />
      <Toast
        open={Boolean(state.message || state.error)}
        message={state.message || state.error || ""}
      />
      <div className="space-y-2">
        <h2 className="font-semibold">Preview</h2>
        <div className="prose max-w-none rounded border p-4">
          <PortableText value={content} components={previewComponents} />
        </div>
      </div>
    </div>
  );
}
