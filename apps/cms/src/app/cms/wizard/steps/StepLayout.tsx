// src/components/cms/StepLayout.tsx
"use client";

import { Button } from "@/components/atoms-shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import { LOCALES } from "@acme/i18n";
import type { Locale, Page, PageComponent } from "@types";
import { fetchJson } from "@ui/utils/fetchJson";
import { ReactNode } from "react";

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

  /** Navigation */
  onBack: () => void;
  onNext: () => void;

  /** Optional inner content for the step */
  children?: ReactNode;
}

const emptyTranslated = (): Record<Locale, string> =>
  LOCALES.reduce(
    (acc, l) => ({ ...acc, [l]: "" }),
    {} as Record<Locale, string>
  );

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
  onBack,
  onNext,
  children,
}: Props): React.JSX.Element | null {
  /**
   * Render **nothing at all** for inactive steps so the DOM
   * contains only a single set of navigation buttons.
   * This keeps Testing-Library queries (and screen-reader focus)
   * unambiguous.
   */
  if (stepIndex !== currentStep) return null;

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
              },
              createdAt: "",
              updatedAt: "",
              createdBy: "",
            } as Page
          }
          onSave={async (fd) => {
            const json = await fetchJson<{ id: string }>(
              `/cms/api/page-draft/${shopId}`,
              {
                method: "POST",
                body: fd,
              }
            );
            setHeaderPageId(json.id);
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
              },
              createdAt: "",
              updatedAt: "",
              createdBy: "",
            } as Page
          }
          onSave={async (fd) => {
            const json = await fetchJson<{ id: string }>(
              `/cms/api/page-draft/${shopId}`,
              {
                method: "POST",
                body: fd,
              }
            );
            setFooterPageId(json.id);
          }}
          onPublish={async () => {}}
          onChange={setFooterComponents}
          style={themeStyle}
        />
      </div>

      {/* Additional step-specific UI ------------------------------------ */}
      {children}

      {/* Navigation ------------------------------------------------------ */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </fieldset>
  );
}
