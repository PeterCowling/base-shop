"use client";

import { Button } from "@/components/atoms/shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import TemplateSelector from "@/app/cms/configurator/components/TemplateSelector";
import { fillLocales } from "@i18n/fillLocales";
import {
  type Page,
  type PageComponent,
  historyStateSchema,
} from "@acme/types";
import { apiRequest } from "../lib/api";
import { useEffect, useState } from "react";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import { STORAGE_KEY } from "../hooks/useConfiguratorPersistence";
import { Cluster } from "@ui/components/atoms/primitives/Cluster";
import { useTranslations } from "@acme/i18n";

interface Props {
  pageTemplates: Array<{
    name: string;
    components: PageComponent[];
    preview: string;
  }>;
  homeLayout: string;
  setHomeLayout: (v: string) => void;
  components: PageComponent[];
  setComponents: (v: PageComponent[]) => void;
  homePageId: string | null;
  setHomePageId: (v: string | null) => void;
  shopId: string;
  themeStyle: React.CSSProperties;
  prevStepId?: string;
  nextStepId?: string;
}

function SimpleToast({
  open,
  message,
  onClose,
}: {
  open: boolean;
  message: string;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div onClick={onClose} role="status">
      {message}
    </div>
  );
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
  prevStepId,
  nextStepId,
}: Props): React.JSX.Element {
  const t = useTranslations();
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [, markComplete] = useStepCompletion("home-page");
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!shopId) return;
      const { data, error } = await apiRequest<Page[]>(
        `/cms/api/pages/${shopId}`,
      );
      if (Array.isArray(data)) {
        const existing: Page | undefined = homePageId
          ? data.find((p) => p.id === homePageId)
          : data.find((p) => p.slug === "");
        if (existing) {
          setHomePageId(existing.id);
          setComponents(existing.components as PageComponent[]);
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
  }, [shopId, homePageId, setComponents, setHomePageId]);
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t("cms.configurator.homePage.title")}</h2>
      <TemplateSelector
        value={homeLayout}
        pageTemplates={pageTemplates}
        onConfirm={(layout, comps) => {
          setHomeLayout(layout);
          setComponents(comps);
          if (typeof window !== "undefined") {
            try {
              const json = localStorage.getItem(STORAGE_KEY);
              if (json) {
                const data = JSON.parse(json);
                data.homeLayout = layout;
                data.components = comps;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                window.dispatchEvent(new CustomEvent("configurator:update"));
              }
            } catch {
              /* ignore */
            }
          }
        }}
        triggerProps={{ "data-tour": "select-template" }}
      />
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
        onSave={async (fd: FormData) => {
          setIsSaving(true);
          setSaveError(null);
          const { data, error } = await apiRequest<{ id: string }>(
            `/cms/api/page-draft/${shopId}`,
            { method: "POST", body: fd },
          );
          setIsSaving(false);
          if (data) {
            setHomePageId(data.id);
            setToast({ open: true, message: String(t("cms.configurator.homePage.draftSaved")) });
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
            setHomePageId(data.id);
            setToast({ open: true, message: String(t("cms.configurator.homePage.pagePublished")) });
          } else if (error) {
            setPublishError(error);
          }
        }}
        saving={isSaving}
        publishing={isPublishing}
        saveError={saveError}
        publishError={publishError}
        onChange={setComponents}
        style={themeStyle}
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
      <SimpleToast
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        message={toast.message}
      />
    </div>
  );
}
