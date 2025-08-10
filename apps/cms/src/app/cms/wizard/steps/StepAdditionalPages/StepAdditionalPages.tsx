"use client";

import { Button } from "@/components/atoms/shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import { LOCALES } from "@acme/i18n";
import type { Locale, Page, PageComponent } from "@types";
import { fetchJson } from "@shared-utils";
import { useState } from "react";
import { Toast } from "@/components/atoms";
import type { PageInfo } from "../schema";
import { toPageInfo } from "../utils/page-utils";
import PageLayoutSelector from "./PageLayoutSelector";
import PageMetaForm from "./PageMetaForm";
import useNewPageState from "./useNewPageState";
import usePagesLoader from "./usePagesLoader";

interface Props {
  pageTemplates: Array<{ name: string; components: PageComponent[] }>;
  pages: PageInfo[];
  setPages: (v: PageInfo[]) => void;
  shopId: string;
  themeStyle: React.CSSProperties;
  onBack: () => void;
  onNext: () => void;
}

export default function StepAdditionalPages({
  pageTemplates,
  pages,
  setPages,
  shopId,
  themeStyle,
  onBack,
  onNext,
}: Props): React.JSX.Element {
  const languages = LOCALES as readonly Locale[];
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

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

  usePagesLoader({
    shopId,
    languages,
    setPages,
    adding,
    draftId: newDraftId,
    setComponents: setNewComponents,
    setToast,
  });

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Additional Pages</h2>
      {pages.length > 0 && (
        <ul className="list-disc pl-5 text-sm">
          {pages.map((p) => (
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
                  title: LOCALES.reduce(
                    (acc, l) => ({ ...acc, [l]: "" }),
                    {} as Record<Locale, string>
                  ),
                  description: LOCALES.reduce(
                    (acc, l) => ({ ...acc, [l]: "" }),
                    {} as Record<Locale, string>
                  ),
                  image: LOCALES.reduce(
                    (acc, l) => ({ ...acc, [l]: "" }),
                    {} as Record<Locale, string>
                  ),
                },
                createdAt: "",
                updatedAt: "",
                createdBy: "",
              } as Page
            }
            onSave={async (fd) => {
              try {
                const json = await fetchJson<{ id: string }>(
                  `/cms/api/page-draft/${shopId}`,
                  {
                    method: "POST",
                    body: fd,
                  }
                );
                setNewDraftId(json.id);
                setToast({ open: true, message: "Draft saved" });
              } catch {
                setToast({ open: true, message: "Failed to save page" });
              }
            }}
            onPublish={async () => {}}
            onChange={setNewComponents}
            style={themeStyle}
          />
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                resetFields();
                setAdding(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setPages([
                  ...pages,
                  toPageInfo(
                    {
                      id: newDraftId ?? undefined,
                      slug: newSlug,
                      title: newTitle,
                      description: newDesc,
                      image: newImage,
                      components: newComponents,
                    },
                    languages
                  ),
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
      {!adding && <Button onClick={() => setAdding(true)}>Add Page</Button>}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Next</Button>
      </div>
      <Toast
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        message={toast.message}
      />
    </div>
  );
}

