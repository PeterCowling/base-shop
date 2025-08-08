"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms-shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import { LOCALES } from "@acme/i18n";
import type { Locale, Page, PageComponent } from "@types";
import { historyStateSchema } from "@types";
import { fetchJson } from "@ui/utils/fetchJson";
import { ulid } from "ulid";
import { useEffect } from "react";

interface Props {
  pageTemplates: Array<{ name: string; components: PageComponent[] }>;
  homeLayout: string;
  setHomeLayout: (v: string) => void;
  components: PageComponent[];
  setComponents: (v: PageComponent[]) => void;
  homePageId: string | null;
  setHomePageId: (v: string | null) => void;
  shopId: string;
  themeStyle: React.CSSProperties;
  onBack: () => void;
  onNext: () => void;
}

export default function StepHomePage({
  pageTemplates,
  homeLayout,
  setHomeLayout,
  components,
  setComponents,
  homePageId,
  setHomePageId,
  shopId,
  themeStyle,
  onBack,
  onNext,
}: Props): React.JSX.Element {
  useEffect(() => {
    (async () => {
      if (!shopId) return;
      try {
        const pages = await fetchJson<Page[]>(`/cms/api/pages/${shopId}`);
        const existing = homePageId
          ? pages.find((p) => p.id === homePageId)
          : pages.find((p) => p.slug === "");
        if (existing) {
          setHomePageId(existing.id);
          setComponents(existing.components);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              `page-builder-history-${existing.id}`,
              JSON.stringify(
                historyStateSchema.parse(
                  existing.history ?? {
                    past: [],
                    present: existing.components,
                    future: [],
                  }
                )
              )
            );
          }
        }
      } catch {
        /* ignore */
      }
    })();
  }, [shopId, homePageId, setComponents, setHomePageId]);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Home Page</h2>
      <Select
        value={homeLayout}
        onValueChange={(val) => {
          const layout = val === "blank" ? "" : val;
          setHomeLayout(layout);
          const tpl = pageTemplates.find((t) => t.name === layout);
          if (tpl) {
            setComponents(tpl.components.map((c) => ({ ...c, id: ulid() })));
          } else {
            setComponents([]);
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
      <PageBuilder
        page={
          {
            id: homePageId ?? "",
            slug: "",
            status: "draft",
            components,
            seo: {
              title: LOCALES.reduce(
                (acc, l) => ({ ...acc, [l]: "" }),
                {} as Record<Locale, string>
              ),
              description: LOCALES.reduce(
                (acc, l) => ({ ...acc, [l]: "" }),
                {} as Record<Locale, string>
              ),
              image: "",
            },
            createdAt: "",
            updatedAt: "",
            createdBy: "",
          } as Page
        }
        onSave={async (fd) => {
          const json = await fetchJson<{ id: string }>(
            `/cms/api/page-draft/${shopId}`,
            {
              method: "POST",
              body: fd,
            }
          );
          setHomePageId(json.id);
        }}
        onPublish={async (fd) => {
          try {
            fd.set("status", "published");
            const json = await fetchJson<{ id: string }>(
              `/cms/api/page/${shopId}`,
              {
                method: "POST",
                body: fd,
              }
            );
            setHomePageId(json.id);
            alert("Page published");
          } catch {
            alert("Failed to publish page");
          }
        }}
        onChange={setComponents}
        style={themeStyle}
      />
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </div>
  );
}
