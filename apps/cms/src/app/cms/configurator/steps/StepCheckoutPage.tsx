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
    setCheckoutLayout ?? ((v: string) => update?.("checkoutLayout" as any, v));
  const components = (checkoutComponents ?? state?.checkoutComponents ?? []) as PageComponent[];
  const setComponents =
    setCheckoutComponents ?? ((v: PageComponent[]) => update?.("checkoutComponents" as any, v));
  const pageId = checkoutPageId ?? state?.checkoutPageId ?? null;
  const setPageId =
    setCheckoutPageId ?? ((v: string | null) => update?.("checkoutPageId" as any, v));
  const currentShopId = shopId ?? state?.shopId ?? "";
  const style = themeStyle ?? useThemeLoader();
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [, markComplete] = useStepCompletion("checkout-page");
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Checkout Page</h2>
      <Select
        data-cy="checkout-layout"
        value={layout}
        onValueChange={(val: string) => {
          const layout = val === "blank" ? "" : val;
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
          <SelectValue placeholder="Select template" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="blank">Blank</SelectItem>
          {templates.map((t) => (
            <SelectItem key={t.name} value={t.name}>
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
            setToast({ open: true, message: "Draft saved" });
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
