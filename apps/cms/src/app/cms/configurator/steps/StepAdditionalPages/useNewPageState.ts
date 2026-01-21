"use client";

import { useState } from "react";

import type { Locale, PageComponent } from "@acme/types";

export default function useNewPageState(languages: readonly Locale[]) {
  const createEmptyLocaleRecord = () =>
    languages.reduce(
      (acc, l) => ({ ...acc, [l]: "" }),
      {} as Record<Locale, string>
    );

  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState<Record<Locale, string>>(
    createEmptyLocaleRecord
  );
  const [desc, setDesc] = useState<Record<Locale, string>>(
    createEmptyLocaleRecord
  );
  const [image, setImage] = useState<Record<Locale, string>>(
    createEmptyLocaleRecord
  );
  const [components, setComponents] = useState<PageComponent[]>([]);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pageLayout, setPageLayout] = useState("");

  const resetFields = () => {
    setSlug("");
    setTitle(createEmptyLocaleRecord());
    setDesc(createEmptyLocaleRecord());
    setImage(createEmptyLocaleRecord());
    setComponents([]);
    setDraftId(null);
    setPageLayout("");
  };

  return {
    slug,
    setSlug,
    title,
    setTitle,
    desc,
    setDesc,
    image,
    setImage,
    components,
    setComponents,
    draftId,
    setDraftId,
    adding,
    setAdding,
    pageLayout,
    setPageLayout,
    resetFields,
  };
}

