// src/components/cms/StepLayout.tsx
"use client";

import PageBuilder from "@/components/cms/PageBuilder";
import { fillLocales } from "@i18n/fillLocales";
import type { Page, PageComponent } from "@acme/types";
import { fetchJson } from "@shared-utils";
import { ReactNode, useState } from "react";
import { Toast } from "@/components/atoms";
import useStepCompletion from "../hooks/useStepCompletion";
import { useConfigurator } from "../ConfiguratorContext";
import { useThemeLoader } from "../hooks/useThemeLoader";
import { StepControls } from "../steps";

interface Props {
  /** Optional inner content for the step */
  children?: ReactNode;
  previousStepId?: string;
  nextStepId?: string;
}

const emptyTranslated = () => fillLocales(undefined, "");

export default function StepLayout({
  children,
  previousStepId,
  nextStepId,
}: Props): React.JSX.Element {
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
            try {
              const json = await fetchJson<{ id: string }>(
                `/cms/api/page-draft/${shopId}`,
                {
                  method: "POST",
                  body: fd,
                }
              );
              setHeaderPageId(json.id);
              setToast({ open: true, message: "Header saved" });
            } catch {
              setToast({ open: true, message: "Failed to save header" });
            }
          }}
          onPublish={async () => {}}
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
            try {
              const json = await fetchJson<{ id: string }>(
                `/cms/api/page-draft/${shopId}`,
                {
                  method: "POST",
                  body: fd,
                }
              );
              setFooterPageId(json.id);
              setToast({ open: true, message: "Footer saved" });
            } catch {
              setToast({ open: true, message: "Failed to save footer" });
            }
          }}
          onPublish={async () => {}}
          onChange={setFooterComponents}
          style={themeStyle}
        />
      </div>

      {/* Additional step-specific UI ------------------------------------ */}
      {children}

      {/* Navigation ------------------------------------------------------ */}
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
    </fieldset>
  );
}
