"use client";

import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import { LOCALES } from "@acme/i18n";
import type { Locale, Page, PageComponent } from "@types";
import { historyStateSchema } from "@types";
import { fetchJson } from "@ui/utils/network";
import { ulid } from "ulid";
import { useEffect, useState } from "react";
import { toPageInfo } from "../utils/page-utils";
import { Toast } from "@/components/atoms";

import type { PageInfo } from "../schema";

interface Props {
  pageTemplates: Array<{ name: string; components: PageComponent[] }>;
  pages: PageInfo[];
  setPages: (v: PageInfo[]) => void;
  newSlug: string;
  setNewSlug: (v: string) => void;
  newTitle: Record<Locale, string>;
  setNewTitle: (v: Record<Locale, string>) => void;
  newDesc: Record<Locale, string>;
  setNewDesc: (v: Record<Locale, string>) => void;
  newImage: Record<Locale, string>;
  setNewImage: (v: Record<Locale, string>) => void;
  newComponents: PageComponent[];
  setNewComponents: (v: PageComponent[]) => void;
  newDraftId: string | null;
  setNewDraftId: (v: string | null) => void;
  adding: boolean;
  setAdding: (v: boolean) => void;
  newPageLayout: string;
  setNewPageLayout: (v: string) => void;
  shopId: string;
  themeStyle: React.CSSProperties;
  onBack: () => void;
  onNext: () => void;
}

export default function StepAdditionalPages({
  pageTemplates,
  pages,
  setPages,
  newSlug,
  setNewSlug,
  newTitle,
  setNewTitle,
  newDesc,
  setNewDesc,
  newImage,
  setNewImage,
  newComponents,
  setNewComponents,
  newDraftId,
  setNewDraftId,
  adding,
  setAdding,
  newPageLayout,
  setNewPageLayout,
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
  useEffect(() => {
    (async () => {
      if (!shopId) return;
      try {
        const loaded = await fetchJson<Page[]>(`/cms/api/pages/${shopId}`);
        setPages(loaded.map((p) => toPageInfo(p, languages)));
        if (typeof window !== "undefined") {
          loaded.forEach((p) => {
            localStorage.setItem(
              `page-builder-history-${p.id}`,
              JSON.stringify(
                historyStateSchema.parse(
                  p.history ?? {
                    past: [],
                    present: p.components,
                    future: [],
                  }
                )
              )
            );
          });
        }
      } catch {
        setToast({ open: true, message: "Failed to load pages" });
      }
    })();
  }, [shopId, setPages, languages]);

  useEffect(() => {
    if (!adding || !newDraftId || !shopId) return;
    (async () => {
      try {
        const pages = await fetchJson<Page[]>(`/cms/api/pages/${shopId}`);
        const p = pages.find((pg) => pg.id === newDraftId);
        if (p) {
          setNewComponents(p.components);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              `page-builder-history-${p.id}`,
              JSON.stringify(
                historyStateSchema.parse(
                  p.history ?? {
                    past: [],
                    present: p.components,
                    future: [],
                  }
                )
              )
            );
          }
        }
      } catch {
        setToast({ open: true, message: "Failed to load pages" });
      }
    })();
  }, [adding, newDraftId, shopId, setNewComponents]);
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
          <Select
            value={newPageLayout}
            onValueChange={(val) => {
              const layout = val === "blank" ? "" : val;
              setNewPageLayout(layout);
              const tpl = pageTemplates.find((t) => t.name === layout);
              if (tpl) {
                setNewComponents(
                  tpl.components.map((c) => ({ ...c, id: ulid() }))
                );
              } else {
                setNewComponents([]);
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blank">Blank</SelectItem>
              {pageTemplates.map((t) => (
                <SelectItem key={t.name} value={t.name}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex flex-col gap-1">
            <span>Slug</span>
            <Input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
            />
          </label>
          {languages.map((l) => (
            <div key={l} className="space-y-2">
              <label className="flex flex-col gap-1">
                <span>Title ({l})</span>
                <Input
                  value={newTitle[l]}
                  onChange={(e) =>
                    setNewTitle({ ...newTitle, [l]: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Description ({l})</span>
                <Input
                  value={newDesc[l]}
                  onChange={(e) =>
                    setNewDesc({ ...newDesc, [l]: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Image URL ({l})</span>
                <Input
                  value={newImage[l]}
                  onChange={(e) =>
                    setNewImage({ ...newImage, [l]: e.target.value })
                  }
                />
              </label>
            </div>
          ))}
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
                setAdding(false);
                setNewDraftId(null);
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
                setNewSlug("");
                const createEmptyLocaleRecord = () =>
                  languages.reduce(
                    (acc, l) => ({ ...acc, [l]: "" }),
                    {} as Record<Locale, string>
                  );
                setNewTitle(createEmptyLocaleRecord());
                setNewDesc(createEmptyLocaleRecord());
                setNewImage(createEmptyLocaleRecord());
                setNewComponents([]);
                setNewDraftId(null);
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
