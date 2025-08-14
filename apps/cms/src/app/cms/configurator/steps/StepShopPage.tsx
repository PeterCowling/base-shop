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
import { apiRequest } from "../lib/api";
import { ulid } from "ulid";
import { useState } from "react";
import { Toast } from "@/components/atoms";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";

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
  prevStepId?: string;
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
  prevStepId,
  nextStepId,
}: Props): React.JSX.Element {
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [, markComplete] = useStepCompletion("shop-page");
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

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
          setIsSaving(true);
          setSaveError(null);
          const { data, error } = await apiRequest<{ id: string }>(
            `/cms/api/page-draft/${shopId}`,
            { method: "POST", body: fd },
          );
          setIsSaving(false);
          if (data) {
            setShopPageId(data.id);
            setToast({ open: true, message: "Draft saved" });
          } else if (error) {
            setSaveError(error);
          }
        }}
        onPublish={async (fd) => {
          setIsPublishing(true);
          setPublishError(null);
          fd.set("status", "published");
          const { data, error } = await apiRequest<{ id: string }>(
            `/cms/api/page/${shopId}`,
            { method: "POST", body: fd },
          );
          setIsPublishing(false);
          if (data) {
            setShopPageId(data.id);
            setToast({ open: true, message: "Page published" });
          } else if (error) {
            setPublishError(error);
          }
        }}
        saving={isSaving}
        publishing={isPublishing}
        saveError={saveError}
        publishError={publishError}
        onChange={setShopComponents}
        style={themeStyle}
      />
      <div className="flex justify-between">
        {prevStepId && (
          <Button
            variant="outline"
            onClick={() => router.push(`/cms/configurator/${prevStepId}`)}
          >
            Back
          </Button>
        )}
        {nextStepId && (
          <Button
            onClick={() => {
              markComplete(true);
              router.push(`/cms/configurator/${nextStepId}`);
            }}
          >
            Next
          </Button>
        )}
      </div>
      <Toast
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        message={toast.message}
      />
    </div>
  );
}
