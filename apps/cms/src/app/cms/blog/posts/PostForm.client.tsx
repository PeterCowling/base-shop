// apps/cms/src/app/cms/blog/posts/PostForm.client.tsx
"use client";

import { useFormState } from "react-dom";
import { useState, useMemo, type ChangeEvent } from "react";
import { Button, Input, Textarea, Toast, Switch } from "@ui";
import { PRODUCTS } from "@/lib/products";
import { slugify } from "@acme/shared-utils";
import {
  defineSchema,
  EditorProvider,
  PortableTextEditable,
  useEditor,
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
  post?: { _id?: string; title?: string; body?: string; slug?: string; excerpt?: string };
}

const schemaDefinition = defineSchema({
  decorators: [{ name: "strong" }, { name: "em" }, { name: "underline" }],
  styles: [
    { name: "normal" },
    { name: "h1" },
    { name: "h2" },
    { name: "h3" },
    { name: "blockquote" },
  ],
  annotations: [
    {
      name: "link",
      type: "object",
      fields: [{ name: "href", type: "string" }],
    },
  ],
  lists: [
    { name: "bullet" },
    { name: "number" },
  ],
  inlineObjects: [],
  blockObjects: [
    {
      name: "productReference",
      type: "object",
      fields: [{ name: "slug", type: "string" }],
    },
  ],
});

function Toolbar() {
  const { send } = useEditor();
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={() => send({ type: "toggleDecorator", name: "strong" })}
      >
        Bold
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => send({ type: "toggleDecorator", name: "em" })}
      >
        Italic
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => send({ type: "toggleStyle", name: "h1" })}
      >
        H1
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => send({ type: "toggleStyle", name: "h2" })}
      >
        H2
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          const href = prompt("URL");
          if (href) {
            send({ type: "addAnnotation", name: "link", value: { href } });
          }
        }}
      >
        Link
      </Button>
    </div>
  );
}

export default function PostForm({ action, submitLabel, post }: Props) {
  const [state, formAction] = useFormState(action, { message: "", error: "" });
  const initialBlocks = useMemo<PortableTextBlock[]>(() => {
    if (Array.isArray(post?.body)) return post.body as PortableTextBlock[];
    try {
      const parsed = post?.body ? JSON.parse(post.body) : [];
      return Array.isArray(parsed) ? (parsed as PortableTextBlock[]) : [];
    } catch {
      return [];
    }
  }, [post?.body]);
  const [blocks, setBlocks] = useState<PortableTextBlock[]>(initialBlocks);
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugEditable, setSlugEditable] = useState(false);
  const [query, setQuery] = useState("");
  const [editorKey, setEditorKey] = useState(0);
  const matches = PRODUCTS.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase()),
  ).slice(0, 5);

  function handleTitleChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setTitle(value);
    if (!slugEditable) setSlug(slugify(value));
  }

  function insertProduct(slug: string) {
    setBlocks((prev) => {
      const next = [...prev, { _type: "productReference", slug }];
      setEditorKey((k) => k + 1);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4 max-w-xl">
        <Input
          name="title"
          label="Title"
          value={title}
          onChange={handleTitleChange}
          required
        />
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Slug</span>
            <label className="flex items-center gap-1 text-sm">
              <Switch
                checked={slugEditable}
                onChange={(e) => setSlugEditable(e.target.checked)}
              />
              <span>Edit</span>
            </label>
          </div>
          <Input
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            readOnly={!slugEditable}
            required
          />
        </div>
        <Textarea
          name="excerpt"
          label="Excerpt"
          defaultValue={post?.excerpt ?? ""}
        />
        <div className="space-y-2">
          <EditorProvider
            key={editorKey}
            initialConfig={{ schemaDefinition, initialValue: blocks }}
          >
            <EventListenerPlugin
              on={(event) => {
                if (event.type === "mutation") {
                  setBlocks(event.value as PortableTextBlock[]);
                }
              }}
            />
            <Toolbar />
            <PortableTextEditable className="min-h-[200px] rounded-md border p-2" />
          </EditorProvider>
          <input type="hidden" name="content" value={JSON.stringify(blocks)} />
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
      <section className="max-w-xl space-y-2">
        <h2 className="text-lg font-medium">Preview</h2>
        <div className="prose rounded-md border p-4">
          <PortableText
            value={blocks}
            components={{
              types: {
                productReference: ({ value }) => (
                  <span data-type="product">{value.slug}</span>
                ),
              },
              marks: {
                link: ({ children, value }) => (
                  <a href={value?.href} className="text-primary underline">
                    {children}
                  </a>
                ),
              },
            }}
          />
        </div>
      </section>
      <Toast
        open={Boolean(state.message || state.error)}
        message={state.message || state.error || ""}
      />
    </div>
  );
}
