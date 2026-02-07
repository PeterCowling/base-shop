"use client";

import { useContext, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ulid } from "ulid";

import { Cluster,Inline } from "@acme/design-system/primitives";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";
import { fillLocales } from "@acme/i18n/fillLocales";
import type { Page, PageComponent } from "@acme/types";
import { useToast } from "@acme/ui/operations";

import PageBuilder from "@/components/cms/PageBuilder";

import { ConfiguratorContext } from "../ConfiguratorContext";
import { STORAGE_KEY } from "../hooks/useConfiguratorPersistence";
import useStepCompletion from "../hooks/useStepCompletion";
import { useThemeLoader } from "../hooks/useThemeLoader";
import { apiRequest } from "../lib/api";

interface Props {
  pageTemplates?: Array<{
    name: string;
    components: PageComponent[];
    preview: string;
  }>;
  shopLayout?: string;
  setShopLayout?: (v: string) => void;
  shopComponents?: PageComponent[];
  setShopComponents?: (v: PageComponent[]) => void;
  shopPageId?: string | null;
  setShopPageId?: (v: string | null) => void;
  shopId?: string;
  themeStyle?: React.CSSProperties;
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
  const t = useTranslations();
  // i18n-exempt -- CMS-1234 [ttl=2026-01-31]
  const CY_CANCEL_TEMPLATE = "cancel-template";
  // i18n-exempt -- CMS-1234 [ttl=2026-01-31]
  const CY_CONFIRM_TEMPLATE = "confirm-template";
  const configurator = useContext(ConfiguratorContext);
  const state = configurator?.state;
  const update = configurator?.update;
  const templates = useMemo(
    () => (Array.isArray(pageTemplates) ? pageTemplates : []),
    [pageTemplates],
  );
  const layout = shopLayout ?? state?.shopLayout ?? "";
  const setLayout =
    setShopLayout ?? ((v: string) => {
      if (update) update("shopLayout", v);
    });
  const components = (shopComponents ?? state?.shopComponents ?? []) as PageComponent[];
  const setComponents =
    setShopComponents ?? ((v: PageComponent[]) => {
      if (update) update("shopComponents", v);
    });
  const pageId = shopPageId ?? state?.shopPageId ?? null;
  const setPageId =
    setShopPageId ?? ((v: string | null) => {
      if (update) update("shopPageId", v);
    });
  const currentShopId = shopId ?? state?.shopId ?? "";
  // Always call hooks unconditionally; then choose value
  const loadedStyle = useThemeLoader();
  const style = themeStyle ?? loadedStyle;
  const toast = useToast();
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
      <h2 className="text-xl font-semibold">{t("cms.configurator.shopPage.title")}</h2>
      <Select
        data-cy="shop-layout"
        value={layout}
        open={selectOpen}
        onOpenChange={setSelectOpen}
        onValueChange={() => {}}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={String(t("cms.configurator.shopPage.selectTemplate"))} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value="blank"
            onSelect={(e) => {
              e.preventDefault();
              setSelectOpen(false);
              setPendingTemplate({ name: "blank", components: [], preview: "" });
            }}
          >
            {t("cms.configurator.shopPage.blank")}
          </SelectItem>
          {templates.map((tpl) => (
            <SelectItem
              key={tpl.name}
              value={tpl.name}
              onSelect={(e) => {
                e.preventDefault();
                setSelectOpen(false);
                setPendingTemplate(tpl);
              }}
            >
              <Inline gap={2} alignY="center" data-cy={`template-${tpl.name.replace(/\s+/g, '-')}`}>
                {tpl.preview && (
                  <Image
                    src={tpl.preview}
                    alt={String(
                      t("cms.configurator.shopPage.previewAlt", { name: tpl.name }),
                    )}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded object-cover"
                  />
                )}
                {tpl.name}
              </Inline>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("cms.configurator.shopPage.useTemplateConfirm", {
                name:
                  pendingTemplate?.name === "blank"
                    ? t("cms.configurator.shopPage.blank")
                    : pendingTemplate?.name ?? "",
              })}
            </DialogTitle>
          </DialogHeader>
          {pendingTemplate?.preview && (
            <Image
              src={pendingTemplate.preview}
              alt={String(
                t("cms.configurator.shopPage.previewAlt", { name: pendingTemplate.name }),
              )}
              width={800}
              height={600}
              sizes="100vw"
              className="w-full rounded"
            />
          )}
          <DialogFooter>
            <Button
              data-cy={CY_CANCEL_TEMPLATE}
              variant="outline"
              onClick={() => setPendingTemplate(null)}
            >
              {t("actions.cancel")}
            </Button>
            <Button
              data-cy={CY_CONFIRM_TEMPLATE}
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
                setLayout?.(layout);
                setComponents?.(comps);
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
              {t("actions.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PageBuilder
        page={
          {
            id: pageId ?? "",
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
        onSave={async (fd: FormData) => {
          setIsSaving(true);
          setSaveError(null);
          const { data, error } = await apiRequest<{ id: string }>(
            `/cms/api/page-draft/${currentShopId}`,
            { method: "POST", body: fd },
          );
          setIsSaving(false);
          if (data) {
            setPageId?.(data.id);
            toast.success(String(t("cms.configurator.shopPage.draftSaved")));
          } else if (error) {
            setSaveError(error);
          }
        }}
        onPublish={async (fd: FormData) => {
          setIsPublishing(true);
          setPublishError(null);
          fd.set("status", "published");
          const { data, error } = await apiRequest<{ id: string }>(
            `/cms/api/page/${currentShopId}`,
            { method: "POST", body: fd },
          );
          setIsPublishing(false);
          if (data) {
            setPageId?.(data.id);
            toast.success(String(t("cms.configurator.shopPage.pagePublished")));
          } else if (error) {
            setPublishError(error);
          }
        }}
        saving={isSaving}
        publishing={isPublishing}
        saveError={saveError}
        publishError={publishError}
        onChange={setComponents}
        style={style}
      />
      <Cluster justify="between">
        {prevStepId && (
          <Button
            data-cy="back"
            variant="outline"
            onClick={() => router.push(`/cms/configurator/${prevStepId}`)}
          >
            {t("cms.back")}
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
            {t("actions.next")}
          </Button>
        )}
      </Cluster>
    </div>
  );
}
