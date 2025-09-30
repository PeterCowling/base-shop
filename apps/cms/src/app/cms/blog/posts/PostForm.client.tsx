// apps/cms/src/app/cms/blog/posts/PostForm.client.tsx
"use client";

import { useFormState } from "react-dom";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Input, Switch, Textarea, Toast } from "@ui/components/atoms";
import { slugify } from "@acme/shared-utils";
import { PortableText } from "@portabletext/react";
import { useTranslations } from "@acme/i18n";
import {
  previewComponents,
  type PortableTextBlock,
} from "./schema";
import {
  InvalidProductProvider,
  useInvalidProductContext,
} from "./invalidProductContext";
import MainImageField from "./MainImageField";
import RichTextEditor from "./RichTextEditor";

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
    mainImage?: string;
    author?: string;
    categories?: string[];
    products?: string[];
  };
}

function PostFormContent({ action, submitLabel, post }: Props) {
  const t = useTranslations();
  const [state, formAction] = useFormState(action, { message: "", error: "" });
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [editSlug, setEditSlug] = useState(false);
  useEffect(() => {
    if (!editSlug) setSlug(slugify(title));
  }, [title, editSlug]);
  const searchParams = useSearchParams();
  const shopId = searchParams.get("shopId") ?? "";
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const slugId = post?._id;
  useEffect(() => {
    if (!slug || !shopId) {
      setSlugError(null);
      return;
    }
    const handle = setTimeout(async () => {
      setCheckingSlug(true);
      try {
        const params = new URLSearchParams({ slug, shopId });
        if (slugId) params.append("exclude", slugId);
        const res = await fetch(`/api/blog/slug?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.exists) {
            setSlugError(t("cms.blog.postForm.slugExists") as string);
          } else {
            setSlugError(null);
          }
        } else {
          setSlugError(t("cms.blog.postForm.slugCheckFailed") as string);
        }
      } catch {
        setSlugError(t("cms.blog.postForm.slugCheckFailed") as string);
      } finally {
        setCheckingSlug(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [slug, shopId, slugId, t]);
  const [publishedAt, setPublishedAt] = useState(
    post?.publishedAt ? post.publishedAt.slice(0, 16) : "",
  );
  const [mainImage, setMainImage] = useState(post?.mainImage ?? "");
  const [content, setContent] = useState<PortableTextBlock[]>(
    Array.isArray(post?.body)
      ? (post?.body as PortableTextBlock[])
      : typeof post?.body === "string"
        ? JSON.parse(post.body)
        : [],
  );
  const { invalidProducts } = useInvalidProductContext();
  const hasInvalidProducts = Object.keys(invalidProducts).length > 0;

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <Input
          name="title"
          label={t("cms.blog.postForm.titleLabel") as string}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div className="space-y-2">
          <Input
            name="slug"
            label={t("cms.blog.postForm.slugLabel") as string}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            disabled={!editSlug}
            required
            error={slugError ?? undefined}
          />
          <div className="flex items-center gap-2">
            <Switch
              id="edit-slug"
              checked={editSlug}
              onChange={(e) => setEditSlug(e.target.checked)}
            />
            <label htmlFor="edit-slug">{t("cms.blog.postForm.editSlug")}</label>
          </div>
        </div>
        <Textarea
          name="excerpt"
          label={t("cms.blog.postForm.excerptLabel") as string}
          defaultValue={post?.excerpt ?? ""}
        />
        <MainImageField value={mainImage} onChange={setMainImage} />
        <input type="hidden" name="mainImage" value={mainImage} />
        <Input
          name="author"
          label={t("cms.blog.postForm.authorLabel") as string}
          defaultValue={post?.author ?? ""}
        />
        <Input
          name="categories"
          label={t("cms.blog.postForm.categoriesLabel") as string}
          defaultValue={(post?.categories ?? []).join(", ")}
        />
        <Input
          name="products"
          label={t("cms.blog.postForm.productsLabel") as string}
          defaultValue={(post?.products ?? []).join(", ")}
        />
        <Input
          type="datetime-local"
          name="publishedAt"
          label={t("cms.blog.postForm.publishAtLabel") as string}
          value={publishedAt}
          onChange={(e) => setPublishedAt(e.target.value)}
        />
        <div className="space-y-2">
          <RichTextEditor value={content} onChange={setContent} />
        </div>
        <input
          type="hidden"
          name="content"
          value={JSON.stringify(content)}
        />
        {post?._id && <input type="hidden" name="id" value={post._id} />}
        {hasInvalidProducts && (
          <div className="text-danger-foreground">
            {t("cms.blog.postForm.productNotFound", {
              ids: Object.values(invalidProducts).join(", "),
            })}
          </div>
        )}
        <Button
          type="submit"
          disabled={checkingSlug || Boolean(slugError) || hasInvalidProducts}
        >
          {submitLabel}
        </Button>
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
        <h2 className="font-semibold">{t("cms.blog.postForm.preview")}</h2>
        <div className="prose rounded border border-border/10 p-4">
          <PortableText value={content} components={previewComponents} />
        </div>
      </div>
    </div>
  );
}

export default function PostForm(props: Props) {
  return (
    <InvalidProductProvider>
      <PostFormContent {...props} />
    </InvalidProductProvider>
  );
}
