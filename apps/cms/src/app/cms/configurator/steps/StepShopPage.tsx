"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/atoms/shadcn";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@ui/components/atoms";
import PageBuilder from "@/components/cms/PageBuilder";
import { fillLocales } from "@i18n/fillLocales";
import type { Page, PageComponent } from "@acme/types";
import { apiRequest } from "../lib/api";
import { ulid } from "ulid";
import { useState } from "react";
import { Toast } from "@ui/components/atoms";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { STORAGE_KEY } from "../hooks/useConfiguratorPersistence";

interface Props {
  pageTemplates: Array<{
    name: string;
    components: PageComponent[];
    preview: string;
  }>;
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
  const [selectOpen, setSelectOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] =
    useState<{ name: string; components: PageComponent[]; preview: string } | null>(
      null,
    );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Shop Page</h2>
      <Select
        data-cy="shop-layout"
        value={shopLayout}
        open={selectOpen}
        onOpenChange={setSelectOpen}
        onValueChange={() => {}}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select template" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value="blank"
            asChild
            onSelect={(e) => {
              e.preventDefault();
              setSelectOpen(false);
              setPendingTemplate({ name: "blank", components: [], preview: "" });
            }}
          >
            <button
              type="button"
              data-cy="template-blank"
              className="w-full text-left"
            >
              Blank
            </button>
          </SelectItem>
          {pageTemplates.map((t) => (
            <SelectItem
              key={t.name}
              value={t.name}
              asChild
              onSelect={(e) => {
                e.preventDefault();
                setSelectOpen(false);
                setPendingTemplate(t);
              }}
            >
              <button
                type="button"
                data-cy={`template-${t.name.replace(/\s+/g, '-')}`}
                className="w-full text-left"
              >
                <div className="flex items-center gap-2">
                  {t.preview && (
                    <Image
                      src={t.preview}
                      alt={`${t.name} preview`}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded object-cover"
                    />
                  )}
                  {t.name}
                </div>
              </button>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Dialog
        open={!!pendingTemplate}
        onOpenChange={(o: boolean) => {
          if (!o) setPendingTemplate(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Use
              {pendingTemplate?.name === "blank"
                ? " Blank"
                : ` ${pendingTemplate?.name}`}
              {" "}template?
            </DialogTitle>
          </DialogHeader>
          {pendingTemplate?.preview && (
            <Image
              src={pendingTemplate.preview}
              alt={`${pendingTemplate.name} preview`}
              width={800}
              height={600}
              sizes="100vw"
              className="w-full rounded"
            />
          )}
          <DialogFooter>
            <Button
              data-cy="cancel-template"
              variant="outline"
              onClick={() => setPendingTemplate(null)}
            >
              Cancel
            </Button>
            <Button
              data-cy="confirm-template"
              onClick={() => {
                if (!pendingTemplate) return;
                const layout =
                  pendingTemplate.name === "blank"
                    ? ""
                    : pendingTemplate.name;
                const comps = pendingTemplate.components.map((c) => ({
                  ...c,
                  id: ulid(),
                }));
                setShopLayout(layout);
                setShopComponents(comps);
                if (typeof window !== "undefined") {
                  try {
                    const json = localStorage.getItem(STORAGE_KEY);
                    if (json) {
                      const data = JSON.parse(json);
                      data.shopLayout = layout;
                      data.shopComponents = comps;
                      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                      window.dispatchEvent(
                        new CustomEvent("configurator:update"),
                      );
                    }
                  } catch {
                    /* ignore */
                  }
                }
                setPendingTemplate(null);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
        onSave={async (fd: FormData) => {
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
        onPublish={async (fd: FormData) => {
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
            data-cy="back"
            variant="outline"
            onClick={() => router.push(`/cms/configurator/${prevStepId}`)}
          >
            Back
          </Button>
        )}
        {nextStepId && (
          <Button
            data-cy="next"
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
