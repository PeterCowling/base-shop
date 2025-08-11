// apps/cms/src/app/cms/blog/posts/PostForm.client.tsx
"use client";

import { useFormState } from "react-dom";
import { useState } from "react";
import { Button, Input, Textarea, Toast, Checkbox } from "@ui";
import {
  EditorProvider,
  PortableTextEditable,
  type PortableTextBlock,
  defineSchema,
  type RenderAnnotationFunction,
  type RenderBlockFunction,
  type RenderDecoratorFunction,
  type RenderStyleFunction,
  useEditor,
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
  decorators: [{ name: "strong" }, { name: "em" }],
  annotations: [{ name: "link", fields: [{ name: "href", type: "string" }] }],
  styles: [{ name: "normal" }, { name: "h1" }, { name: "h2" }, { name: "h3" }],
  blockObjects: [{ name: "image", fields: [{ name: "src", type: "string" }] }],
});

const renderDecorator: RenderDecoratorFunction = (props) => {
  if (props.value === "strong") {
    return <strong>{props.children}</strong>;
  }
  if (props.value === "em") {
    return <em>{props.children}</em>;
  }
  return <>{props.children}</>;
};

const renderAnnotation: RenderAnnotationFunction = (props) => {
  if (props.schemaType.name === "link") {
    return (
      <a
        href={(props.value as any)?.href}
        className="underline text-blue-600"
        target="_blank"
        rel="noopener noreferrer"
      >
        {props.children}
      </a>
    );
  }
  return <>{props.children}</>;
};

const renderBlock: RenderBlockFunction = (props) => {
  if (props.schemaType.name === "image") {
    const src = (props.value as any)?.src;
    if (src) {
      return <img src={src} alt="" className="my-2" />;
    }
  }
  return <div>{props.children}</div>;
};

const renderStyle: RenderStyleFunction = (props) => {
  if (props.schemaType.value === "h1") {
    return <h1 className="text-2xl font-bold">{props.children}</h1>;
  }
  if (props.schemaType.value === "h2") {
    return <h2 className="text-xl font-bold">{props.children}</h2>;
  }
  if (props.schemaType.value === "h3") {
    return <h3 className="text-lg font-bold">{props.children}</h3>;
  }
  return <p>{props.children}</p>;
};

function Toolbar() {
  const editor = useEditor();
  const addLink = () => {
    const href = window.prompt("Enter URL");
    if (href) {
      editor.send({
        type: "annotation.add",
        annotation: { name: "link", value: { href } },
      });
      editor.send({ type: "focus" });
    }
  };
  const addImage = () => {
    const src = window.prompt("Image URL");
    if (src) {
      editor.send({
        type: "insert.block object",
        blockObject: { name: "image", value: { src } },
        placement: "auto",
      });
      editor.send({ type: "focus" });
    }
  };
  return (
    <div className="flex flex-wrap gap-2 mb-2">
      <Button
        type="button"
        onClick={() => {
          editor.send({ type: "decorator.toggle", decorator: "strong" });
          editor.send({ type: "focus" });
        }}
      >
        Bold
      </Button>
      <Button
        type="button"
        onClick={() => {
          editor.send({ type: "decorator.toggle", decorator: "em" });
          editor.send({ type: "focus" });
        }}
      >
        Italic
      </Button>
      <Button
        type="button"
        onClick={() => {
          editor.send({ type: "style.toggle", style: "h1" });
          editor.send({ type: "focus" });
        }}
      >
        H1
      </Button>
      <Button
        type="button"
        onClick={() => {
          editor.send({ type: "style.toggle", style: "h2" });
          editor.send({ type: "focus" });
        }}
      >
        H2
      </Button>
      <Button
        type="button"
        onClick={() => {
          editor.send({ type: "style.toggle", style: "h3" });
          editor.send({ type: "focus" });
        }}
      >
        H3
      </Button>
      <Button type="button" onClick={addLink}>
        Link
      </Button>
      <Button type="button" onClick={addImage}>
        Image
      </Button>
    </div>
  );
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export default function PostForm({ action, submitLabel, post }: Props) {
  const [state, formAction] = useFormState(action, { message: "", error: "" });
  const [title, setTitle] = useState(post?.title ?? "");
  const [slugEditable, setSlugEditable] = useState(false);
  const [slug, setSlug] = useState(post?.slug ?? slugify(post?.title ?? ""));
  const initialContent = (() => {
    try {
      return post?.body ? (JSON.parse(post.body) as PortableTextBlock[]) : [];
    } catch {
      return [] as PortableTextBlock[];
    }
  })();
  const [content, setContent] = useState<PortableTextBlock[]>(initialContent);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    if (!slugEditable) {
      setSlug(slugify(value));
    }
  };

  const handleSlugToggle = (checked: boolean | "indeterminate") => {
    const enabled = checked === true;
    setSlugEditable(enabled);
    if (!enabled) {
      setSlug(slugify(title));
    }
  };

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
        <div className="flex items-end gap-2">
          <Input
            name="slug"
            label="Slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            required
            disabled={!slugEditable}
          />
          <div className="flex items-center gap-1 pb-2">
            <Checkbox
              id="slug-edit"
              checked={slugEditable}
              onCheckedChange={handleSlugToggle}
            />
            <label htmlFor="slug-edit" className="text-sm">
              Edit
            </label>
          </div>
        </div>
        <Textarea name="excerpt" label="Excerpt" defaultValue={post?.excerpt ?? ""} />
        <div>
          <label className="mb-1 block text-sm font-medium">Content</label>
          <EditorProvider
            initialConfig={{ schemaDefinition, initialValue: content }}
          >
            <EventListenerPlugin
              on={(event) => {
                if (event.type === "mutation") {
                  setContent(event.value as PortableTextBlock[]);
                }
              }}
            />
            <Toolbar />
            <PortableTextEditable
              renderDecorator={renderDecorator}
              renderAnnotation={renderAnnotation}
              renderBlock={renderBlock}
              renderStyle={renderStyle}
              className="border rounded p-2 min-h-[200px]"
            />
          </EditorProvider>
          <input type="hidden" name="content" value={JSON.stringify(content)} />
        </div>
        {post?._id && <input type="hidden" name="id" value={post._id} />}
        <Button type="submit">{submitLabel}</Button>
      </form>
      <div className="max-w-xl">
        <h3 className="text-lg font-medium">Preview</h3>
        <div className="prose max-w-none border rounded p-4 mt-2">
          <PortableText
            value={content}
            components={{
              types: {
                image: ({ value }) => <img src={(value as any).src} alt="" />,
              },
              marks: {
                link: ({ value, children }) => (
                  <a
                    href={(value as any)?.href}
                    className="underline text-blue-600"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
              },
            }}
          />
        </div>
      </div>
      <Toast open={Boolean(state.message || state.error)} message={state.message || state.error || ""} />
    </div>
  );
}
