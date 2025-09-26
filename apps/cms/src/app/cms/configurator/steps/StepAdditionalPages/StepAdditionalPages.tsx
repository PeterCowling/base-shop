"use client";

import { Button } from "@/components/atoms/shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import { LOCALES } from "@acme/i18n";
import { fillLocales } from "@i18n/fillLocales";
import type { Locale, Page, PageComponent } from "@acme/types";
import { apiRequest } from "../../lib/api";
import { useState } from "react";
import { Toast } from "@/components/atoms";
import type { PageInfo } from "../../../wizard/schema";
import { toPageInfo } from "../../../wizard/utils/page-utils";
import PageLayoutSelector from "./PageLayoutSelector";
import PageMetaForm from "./PageMetaForm";
import useNewPageState from "./useNewPageState";
import usePagesLoader from "./usePagesLoader";
import useStepCompletion from "../../hooks/useStepCompletion";
import { useRouter } from "next/navigation";

interface Props {
  pageTemplates: Array<{ name: string; components: PageComponent[] }>;
  pages: PageInfo[];
  setPages: (v: PageInfo[]) => void;
  shopId: string;
  themeStyle: React.CSSProperties;
}

export default function StepAdditionalPages({
  pageTemplates,
  pages,
  setPages,
  shopId,
  themeStyle,
}: Props): React.JSX.Element {
  const safePages = Array.isArray(pages) ? pages : [];
  const languages = LOCALES as readonly Locale[];
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const {
    slug: newSlug,
    setSlug: setNewSlug,
    title: newTitle,
    setTitle: setNewTitle,
    desc: newDesc,
    setDesc: setNewDesc,
    image: newImage,
    setImage: setNewImage,
    components: newComponents,
    setComponents: setNewComponents,
    draftId: newDraftId,
    setDraftId: setNewDraftId,
    adding,
    setAdding,
    pageLayout: newPageLayout,
    setPageLayout: setNewPageLayout,
    resetFields,
  } = useNewPageState(languages);
  const [, markComplete] = useStepCompletion("additional-pages");
  const router = useRouter();

  usePagesLoader({
    shopId,
    setPages,
    adding,
    draftId: newDraftId,
    setComponents: setNewComponents,
    setToast,
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Additional Pages</h2>
      {safePages.length > 0 && (
        <ul className="list-disc pl-5 text-sm">
          {safePages.map((p) => (
            <li key={p.slug}>{p.slug}</li>
          ))}
        </ul>
      )}
      {adding && (
        <div className="space-y-2">
          <PageLayoutSelector
            pageTemplates={pageTemplates}
            newPageLayout={newPageLayout}
            setNewPageLayout={setNewPageLayout}
            setNewComponents={setNewComponents}
          />
          <PageMetaForm
            languages={languages}
            slug={newSlug}
            setSlug={setNewSlug}
            title={newTitle}
            setTitle={setNewTitle}
            desc={newDesc}
            setDesc={setNewDesc}
            image={newImage}
            setImage={setNewImage}
          />
          <PageBuilder
            page={
              {
                id: newDraftId ?? "",
                slug: "",
                status: "draft",
                components: newComponents,
                seo: {
                  title: fillLocales(undefined, ""),
                  description: fillLocales(undefined, ""),
                  image: fillLocales(undefined, ""),
                  brand: fillLocales(undefined, ""),
                  offers: fillLocales(undefined, ""),
                  aggregateRating: fillLocales(undefined, ""),
                },
                createdAt: "",
                updatedAt: "",
                createdBy: "",
              } as Page
            }
            onSave={async (fd: FormData) => {
              setIsSaving(true);
              setSaveError(null);
              const { data, error } = await apiRequest<{ id: string }>(
                `/cms/api/page-draft/${shopId}`,
                { method: "POST", body: fd },
              );
              setIsSaving(false);
              if (data) {
                setNewDraftId(data.id);
                setToast({ open: true, message: "Draft saved" });
              } else if (error) {
                setSaveError(error);
              }
            }}
            onPublish={async () => {}}
            saving={isSaving}
            saveError={saveError}
            onChange={setNewComponents}
            style={themeStyle}
          />
          <div className="flex justify-between">
            <Button
              data-cy="cancel-additional-page"
              variant="outline"
              onClick={() => {
                resetFields();
                setAdding(false);
              }}
            >
              Cancel
            </Button>
            <Button
              data-cy="confirm-add-page"
              onClick={() => {
                setPages([
                  ...safePages,
                  toPageInfo({
                    id: newDraftId ?? undefined,
                    slug: newSlug,
                    title: newTitle,
                    description: newDesc,
                    image: newImage,
                    components: newComponents,
                  }),
                ]);
                resetFields();
                setAdding(false);
              }}
            >
              Add Page
            </Button>
          </div>
        </div>
      )}
      {!adding && (
        <Button data-cy="add-page" onClick={() => setAdding(true)}>
          Add Page
        </Button>
      )}
      <div className="flex justify-end">
        <Button
          data-cy="save-return"
          onClick={() => {
            markComplete(true);
            router.push("/cms/configurator");
          }}
        >
          Save & return
        </Button>
      </div>
      <Toast
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        message={toast.message}
      />
    </div>
  );
}
