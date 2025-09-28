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
import { useContext, useMemo, useState } from "react";
import { Toast } from "@/components/atoms";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import { ConfiguratorContext } from "../ConfiguratorContext";
import { useThemeLoader } from "../hooks/useThemeLoader";
import { useTranslations } from "@acme/i18n";

interface Props {
  pageTemplates?: Array<{ name: string; components: PageComponent[] }>;
  checkoutLayout?: string;
  setCheckoutLayout?: (v: string) => void;
  checkoutComponents?: PageComponent[];
  setCheckoutComponents?: (v: PageComponent[]) => void;
  checkoutPageId?: string | null;
  setCheckoutPageId?: (v: string | null) => void;
  shopId?: string;
  themeStyle?: React.CSSProperties;
}

export default function StepCheckoutPage({
  pageTemplates,
  checkoutLayout,
  setCheckoutLayout,
  checkoutComponents,
  setCheckoutComponents,
  checkoutPageId,
  setCheckoutPageId,
  shopId,
  themeStyle,
}: Props): React.JSX.Element {
  const t = useTranslations();
  const configurator = useContext(ConfiguratorContext);
  // Fallbacks from configurator state when props are omitted (e.g. direct route access)
  const state = configurator?.state;
  const update = configurator?.update;
  const templates = useMemo(
    () => (Array.isArray(pageTemplates) ? pageTemplates : []),
    [pageTemplates],
  );
  const layout = checkoutLayout ?? state?.checkoutLayout ?? "";
  const setLayout =
    setCheckoutLayout ?? (update ? ((v: string) => update("checkoutLayout", v)) : undefined);
  const components = (checkoutComponents ?? state?.checkoutComponents ?? []) as PageComponent[];
  const setComponents =
    setCheckoutComponents ?? (update ? ((v: PageComponent[]) => update("checkoutComponents", v)) : undefined);
  const pageId = checkoutPageId ?? state?.checkoutPageId ?? null;
  const setPageId =
    setCheckoutPageId ?? (update ? ((v: string | null) => update("checkoutPageId", v)) : undefined);
  const currentShopId = shopId ?? state?.shopId ?? "";
  const loadedStyle = useThemeLoader();
  const style = themeStyle ?? loadedStyle;
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [, markComplete] = useStepCompletion(
    "checkout-page", // i18n-exempt -- ABC-123 [ttl=2099-12-31]
  );
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{t("cms.configurator.checkoutPage.title")}</h2>
      <Select
        data-cy="checkout-layout" // i18n-exempt -- ABC-123 [ttl=2099-12-31]
        value={layout}
        onValueChange={(val: string) => {
          const layout = val === "blank" ? "" : val; // i18n-exempt -- ABC-123 [ttl=2099-12-31]
          setLayout?.(layout);
          const tpl = templates.find((t) => t.name === layout);
          if (tpl) {
            setComponents?.(
              tpl.components.map((c) => ({ ...c, id: ulid() }))
            );
          } else {
            setComponents?.([]);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={String(t("cms.configurator.shopPage.selectTemplate"))} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="blank">{t("cms.configurator.shopPage.blank")}</SelectItem>
          {templates.map((t) => (
            <SelectItem key={t.name} value={t.name}>
              {/* i18n-exempt -- ABC-123 [ttl=2099-12-31] */}
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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
            setToast({ open: true, message: String(t("cms.configurator.shopPage.draftSaved")) });
          } else if (error) {
            setSaveError(error);
          }
        }}
        onPublish={async () => {}}
        saving={isSaving}
        saveError={saveError}
        onChange={setComponents}
        style={style}
      />
      <div className="flex justify-end">
        <Button
          data-cy="save-return"
          onClick={() => {
            markComplete(true);
            router.push(
              "/cms/configurator", // i18n-exempt -- ABC-123 [ttl=2099-12-31]
            );
          }}
        >
          {t("cms.configurator.actions.saveReturn")}
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
