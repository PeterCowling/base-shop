// src/components/cms/StepLayout.tsx
"use client";

import { Button } from "@/components/atoms/shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import { fillLocales } from "@i18n/fillLocales";
import type { Page, PageComponent } from "@acme/types";
import { fetchJson } from "@shared-utils";
import { ReactNode, useState } from "react";
import { Toast } from "@/components/atoms";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";

interface Props {
  currentStep: number;
  stepIndex: number;

  /** Header */
  headerComponents: PageComponent[];
  setHeaderComponents: (v: PageComponent[]) => void;
  headerPageId: string | null;
  setHeaderPageId: (v: string | null) => void;

  /** Footer */
  footerComponents: PageComponent[];
  setFooterComponents: (v: PageComponent[]) => void;
  footerPageId: string | null;
  setFooterPageId: (v: string | null) => void;

  /** Context */
  shopId: string;
  themeStyle: React.CSSProperties;

  /** Optional inner content for the step */
  children?: ReactNode;
}

const emptyTranslated = () => fillLocales(undefined, "");

export default function StepLayout({
  currentStep,
  stepIndex,
  headerComponents,
  setHeaderComponents,
  headerPageId,
  setHeaderPageId,
  footerComponents,
  setFooterComponents,
  footerPageId,
  setFooterPageId,
  shopId,
  themeStyle,
  children,
}: Props): React.JSX.Element | null {
  /**
   * Render **nothing at all** for inactive steps so the DOM
   * contains only a single set of navigation buttons.
   * This keeps Testing-Library queries (and screen-reader focus)
   * unambiguous.
   */
  if (stepIndex !== currentStep) return null;

  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [, markComplete] = useStepCompletion("layout");
  const router = useRouter();

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
