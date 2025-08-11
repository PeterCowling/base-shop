// apps/cms/src/app/cms/blog/posts/PostForm.client.tsx
"use client";

import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { Button, Input, Switch, Textarea, Toast } from "@ui";
import { PRODUCTS } from "@/lib/products";
import { slugify } from "@acme/shared-utils";
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
  post?: { _id?: string; title?: string; body?: string; slug?: string; excerpt?: string };
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

const previewComponents = {
  types: {
    productReference: ({ value }: any) => (
      <div className="border p-2">Product: {value.slug}</div>
    ),
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
  matches,
}: {
  query: string;
  setQuery: (v: string) => void;
  matches: typeof PRODUCTS;
}) {
  const editor = useEditor();
  return (
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
                onClick={() =>
                  PortableTextEditor.insertBlock(editor, "productReference", {
                    slug: p.slug,
                  })
                }
              >
                {p.title}
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
  const [content, setContent] = useState<PortableTextBlock[]>(
    Array.isArray(post?.body)
      ? (post?.body as PortableTextBlock[])
      : typeof post?.body === "string"
        ? JSON.parse(post.body)
        : [],
  );
  const [query, setQuery] = useState("");
  const matches = PRODUCTS.filter((p) =>
    p.title.toLowerCase().includes(query.toLowerCase()),
  ).slice(0, 5);

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
            <ProductSearch
              query={query}
              setQuery={setQuery}
              matches={matches}
            />
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
