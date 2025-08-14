"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import { fillLocales } from "@i18n/fillLocales";
import type { Page, PageComponent } from "@acme/types";
import { fetchJson } from "@shared-utils";
import { ulid } from "ulid";
import { useState } from "react";
import { Toast } from "@/components/atoms";
import useStepCompletion from "../hooks/useStepCompletion";
import { StepControls } from "../steps";

interface Props {
  pageTemplates: Array<{ name: string; components: PageComponent[] }>;
  shopLayout: string;
  setShopLayout: (v: string) => void;
  shopComponents: PageComponent[];
  setShopComponents: (v: PageComponent[]) => void;
  shopPageId: string | null;
  setShopPageId: (v: string | null) => void;
  shopId: string;
  themeStyle: React.CSSProperties;
  previousStepId?: string;
  nextStepId?: string;
}

export default function StepShopPage({
  pageTemplates,
  shopLayout,
  setShopLayout,
  shopComponents,
  setShopComponents,
  shopPageId,
  setShopPageId,
  shopId,
  themeStyle,
}: Props): React.JSX.Element {
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [, markComplete] = useStepCompletion("shop-page");

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Shop Page</h2>
      <Select
        value={shopLayout}
        onValueChange={(val) => {
          const layout = val === "blank" ? "" : val;
          setShopLayout(layout);
          const tpl = pageTemplates.find((t) => t.name === layout);
          if (tpl) {
            setShopComponents(
              tpl.components.map((c) => ({ ...c, id: ulid() }))
            );
          } else {
            setShopComponents([]);
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
            id: shopPageId ?? "",
            slug: "",
            status: "draft",
            components: shopComponents,
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
            setShopPageId(json.id);
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
            setShopPageId(json.id);
            setToast({ open: true, message: "Page published" });
          } catch {
            setToast({ open: true, message: "Failed to publish page" });
          }
        }}
        onChange={setShopComponents}
        style={themeStyle}
      />
      <StepControls
        prev={previousStepId}
        next={nextStepId}
        onNext={() => markComplete(true)}
      />
      <Toast
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        message={toast.message}
      />
    </div>
  );
}
