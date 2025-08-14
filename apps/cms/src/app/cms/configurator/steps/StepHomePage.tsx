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
import type { Page, PageComponent } from "@acme/types";
import { historyStateSchema } from "@acme/types";
import { fetchJson } from "@shared-utils";
import { ulid } from "ulid";
import { useEffect, useState } from "react";
import { Toast } from "@/components/atoms";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";

interface Props {
  pageTemplates: Array<{ name: string; preview?: string; components: PageComponent[] }>;
  homeLayout: string;
  setHomeLayout: (v: string) => void;
  components: PageComponent[];
  setComponents: (v: PageComponent[]) => void;
  homePageId: string | null;
  setHomePageId: (v: string | null) => void;
  shopId: string;
  themeStyle: React.CSSProperties;
}

function templateThumb(label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="4" ry="4" fill="#e5e5e5"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="14" fill="#666" font-family="sans-serif">${label.slice(0,1).toUpperCase()}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
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
            window.dispatchEvent(new CustomEvent("configurator:update"));
          }
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
          const next = tpl
            ? tpl.components.map((c) => ({ ...c, id: ulid() }))
            : [];
          setComponents(next);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("configurator:update"));
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
              <div className="flex items-center gap-2">
                <img
                  src={t.preview ?? templateThumb(t.name)}
                  alt={`${t.name} template preview`}
                  className="h-8 w-8 rounded object-cover"
                />
                <span>{t.name}</span>
              </div>
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
