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
import ProductPageBuilder from "@/components/cms/ProductPageBuilder";
import { fillLocales } from "@i18n/fillLocales";
import { type Page, type PageComponent, historyStateSchema } from "@acme/types";
import { apiRequest } from "../lib/api";
import { ulid } from "ulid";
import { useEffect, useState } from "react";
import { Toast } from "@ui/components/atoms";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";

interface Props {
  pageTemplates: Array<{
    name: string;
    components: PageComponent[];
    preview: string;
  }>;
  productLayout: string;
  setProductLayout: (v: string) => void;
  productComponents: PageComponent[];
  setProductComponents: (v: PageComponent[]) => void;
  productPageId: string | null;
  setProductPageId: (v: string | null) => void;
  shopId: string;
  themeStyle: React.CSSProperties;
}

export default function StepProductPage({
  pageTemplates,
  productLayout,
  setProductLayout,
  productComponents,
  setProductComponents,
  productPageId,
  setProductPageId,
  shopId,
  themeStyle,
}: Props): React.JSX.Element {
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [selectOpen, setSelectOpen] = useState(false);
  const [pendingTemplate, setPendingTemplate] =
    useState<{ name: string; components: PageComponent[]; preview: string } | null>(
      null,
    );

  useEffect(() => {
    (async () => {
      if (!shopId) return;
      const { data, error } = await apiRequest<Page[]>(
        `/cms/api/pages/${shopId}`,
      );
      if (data) {
        const existing: Page | undefined = productPageId
          ? data.find((p) => p.id === productPageId)
          : data.find((p) => p.slug === "product");
        if (existing) {
          setProductPageId(existing.id);
          setProductComponents(existing.components as PageComponent[]);
          if (typeof window !== "undefined") {
            localStorage.setItem(
              `page-builder-history-${existing.id}`,
              JSON.stringify(
                historyStateSchema.parse(
                  existing.history ?? {
                    past: [],
                    present: existing.components as PageComponent[],
                    future: [],
                  }
                )
              )
            );
          }
        }
      } else if (error) {
        setToast({ open: true, message: error });
      }
    })();
  }, [shopId, productPageId, setProductComponents, setProductPageId]);
  const [, markComplete] = useStepCompletion("product-page");
  const router = useRouter();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Product Detail Page</h2>
      <Select
        value={productLayout}
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
            <button type="button" className="w-full text-left">
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
              <button type="button" className="w-full text-left">
                <div className="flex items-center gap-2">
                  <img
                    src={t.preview}
                    alt={`${t.name} preview`}
                    className="h-8 w-8 rounded object-cover"
                  />
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
            <img
              src={pendingTemplate.preview}
              alt={`${pendingTemplate.name} preview`}
              className="w-full rounded"
            />
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingTemplate(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!pendingTemplate) return;
                const layout =
                  pendingTemplate.name === "blank"
                    ? ""
                    : pendingTemplate.name;
                setProductLayout(layout);
                const comps = pendingTemplate.components.map((c) => ({
                  ...c,
                  id: ulid(),
                }));
                setProductComponents(comps);
                setPendingTemplate(null);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ProductPageBuilder
        page={
          {
            id: productPageId ?? "",
            slug: "",
            status: "draft",
            components: productComponents,
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
            setProductPageId(data.id);
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
            setProductPageId(data.id);
            setToast({ open: true, message: "Page published" });
          } else if (error) {
            setPublishError(error);
          }
        }}
        saving={isSaving}
        publishing={isPublishing}
        saveError={saveError}
        publishError={publishError}
        onChange={setProductComponents}
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
