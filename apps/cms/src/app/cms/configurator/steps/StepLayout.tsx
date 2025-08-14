// src/components/cms/StepLayout.tsx
"use client";

import { Button } from "@/components/atoms/shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import { fillLocales } from "@i18n/fillLocales";
import type { Page, PageComponent } from "@acme/types";
import { apiRequest } from "../lib/api";
import { ReactNode, useState } from "react";
import { Toast } from "@/components/atoms";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import { useConfigurator } from "../ConfiguratorContext";
import { useThemeLoader } from "../hooks/useThemeLoader";

interface Props {
  /** Optional inner content for the step */
  children?: ReactNode;
}

const emptyTranslated = () => fillLocales(undefined, "");

export default function StepLayout({ children }: Props): React.JSX.Element {
  const { state, update } = useConfigurator();
  const {
    headerComponents,
    headerPageId,
    footerComponents,
    footerPageId,
    shopId,
  } = state;
  const themeStyle = useThemeLoader();
  const setHeaderComponents = (v: PageComponent[]) => update("headerComponents", v);
  const setHeaderPageId = (v: string | null) => update("headerPageId", v);
  const setFooterComponents = (v: PageComponent[]) => update("footerComponents", v);
  const setFooterPageId = (v: string | null) => update("footerPageId", v);

  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [, markComplete] = useStepCompletion("layout");
  const router = useRouter();
  const [headerSaving, setHeaderSaving] = useState(false);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [footerSaving, setFooterSaving] = useState(false);
  const [footerError, setFooterError] = useState<string | null>(null);

  return (
    <fieldset className="space-y-4">
      <h2 className="text-xl font-semibold">Layout</h2>

      {/* Header builder -------------------------------------------------- */}
      <div className="space-y-2">
        <h3 className="font-medium">Header</h3>
        <PageBuilder
          page={
            {
              id: headerPageId ?? "",
              slug: "",
              status: "draft",
              components: headerComponents,
              seo: {
                title: emptyTranslated(),
                description: emptyTranslated(),
                image: emptyTranslated(),
                brand: emptyTranslated(),
                offers: emptyTranslated(),
                aggregateRating: emptyTranslated(),
              },
              createdAt: "",
              updatedAt: "",
              createdBy: "",
            } as Page
          }
          onSave={async (fd) => {
            setHeaderSaving(true);
            setHeaderError(null);
            const { data, error } = await apiRequest<{ id: string }>(
              `/cms/api/page-draft/${shopId}`,
              { method: "POST", body: fd },
            );
            setHeaderSaving(false);
            if (data) {
              setHeaderPageId(data.id);
              setToast({ open: true, message: "Header saved" });
            } else if (error) {
              setHeaderError(error);
            }
          }}
          onPublish={async () => {}}
          saving={headerSaving}
          saveError={headerError}
          onChange={setHeaderComponents}
          style={themeStyle}
        />
      </div>

      {/* Footer builder -------------------------------------------------- */}
      <div className="space-y-2">
        <h3 className="font-medium">Footer</h3>
        <PageBuilder
          page={
            {
              id: footerPageId ?? "",
              slug: "",
              status: "draft",
              components: footerComponents,
              seo: {
                title: emptyTranslated(),
                description: emptyTranslated(),
                image: emptyTranslated(),
                brand: emptyTranslated(),
                offers: emptyTranslated(),
                aggregateRating: emptyTranslated(),
              },
              createdAt: "",
              updatedAt: "",
              createdBy: "",
            } as Page
          }
          onSave={async (fd) => {
            setFooterSaving(true);
            setFooterError(null);
            const { data, error } = await apiRequest<{ id: string }>(
              `/cms/api/page-draft/${shopId}`,
              { method: "POST", body: fd },
            );
            setFooterSaving(false);
            if (data) {
              setFooterPageId(data.id);
              setToast({ open: true, message: "Footer saved" });
            } else if (error) {
              setFooterError(error);
            }
          }}
          onPublish={async () => {}}
          saving={footerSaving}
          saveError={footerError}
          onChange={setFooterComponents}
          style={themeStyle}
        />
      </div>

      {/* Additional step-specific UI ------------------------------------ */}
      {children}

      {/* Navigation ------------------------------------------------------ */}
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
    </fieldset>
  );
}
