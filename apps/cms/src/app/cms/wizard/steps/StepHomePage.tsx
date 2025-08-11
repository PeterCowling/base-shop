"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import { fillLocales } from "@i18n/fillLocales";
import type { Page, PageComponent } from "@types";
import { historyStateSchema } from "@types";
import { fetchJson } from "@shared-utils";
import { ulid } from "ulid";
import { useEffect, useState } from "react";
import { Toast } from "@/components/atoms";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";

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
}: Props): React.JSX.Element {
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [, markComplete] = useStepCompletion("home-page");
  const router = useRouter();

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
        setToast({ open: true, message: "Failed to load pages" });
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
        onSave={async (fd) => {
          try {
            const json = await fetchJson<{ id: string }>(
              `/cms/api/page-draft/${shopId}`,
              {
                method: "POST",
                body: fd,
              }
            );
            setHomePageId(json.id);
            setToast({ open: true, message: "Draft saved" });
          } catch {
            setToast({ open: true, message: "Failed to save page" });
          }
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
            setToast({ open: true, message: "Page published" });
          } catch {
            setToast({ open: true, message: "Failed to publish page" });
          }
        }}
        onChange={setComponents}
        style={themeStyle}
      />
      <div className="flex justify-end">
        <Button
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
