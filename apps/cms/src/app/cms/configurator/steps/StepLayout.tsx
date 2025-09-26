// src/components/cms/StepLayout.tsx
"use client";

import { Button } from "@/components/atoms/shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import { fillLocales } from "@i18n/fillLocales";
import type { Page, PageComponent } from "@acme/types";
import { apiRequest } from "../lib/api";
import { useState, useEffect, useCallback, type ReactNode } from "react";
import { Alert, Toast, Spinner } from "@/components/atoms";
import { CheckIcon } from "@radix-ui/react-icons";
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
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [, markComplete] = useStepCompletion("layout");
  const router = useRouter();
  const [headerSaving, setHeaderSaving] = useState(false);
  const [headerError, setHeaderError] = useState<string | null>(null);
  const [headerSaved, setHeaderSaved] = useState(true);
  const [footerSaving, setFooterSaving] = useState(false);
  const [footerError, setFooterError] = useState<string | null>(null);
  const [footerSaved, setFooterSaved] = useState(true);

  const setHeaderComponents = useCallback(
    (v: PageComponent[]) => {
      setHeaderSaved(false);
      update("headerComponents", v);
    },
    [update],
  );
  const setHeaderPageId = (v: string | null) => update("headerPageId", v);
  const setFooterComponents = useCallback(
    (v: PageComponent[]) => {
      setFooterSaved(false);
      update("footerComponents", v);
    },
    [update],
  );
  const setFooterPageId = (v: string | null) => update("footerPageId", v);

  const hasUnsavedChanges =
    headerSaving ||
    footerSaving ||
    !headerSaved ||
    !footerSaved;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  const handleReturn = useCallback(() => {
    if (
      hasUnsavedChanges &&
      !window.confirm("You have unsaved changes. Continue?")
    ) {
      return;
    }
    markComplete(true);
    router.push("/cms/configurator");
  }, [hasUnsavedChanges, markComplete, router]);

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
          onSave={async (fd: FormData) => {
            setHeaderSaving(true);
            setHeaderError(null);
            setHeaderSaved(false);
            try {
              const { data, error } = await apiRequest<{ id: string }>(
                `/cms/api/page-draft/${shopId}`,
                { method: "POST", body: fd },
              );
              if (data) {
                setHeaderPageId(data.id);
                setHeaderSaved(true);
                setToast({ open: true, message: "Header saved" });
              } else if (error) {
                setHeaderError(error);
              }
            } finally {
              setHeaderSaving(false);
            }
          }}
          onPublish={async () => {}}
          saving={headerSaving}
          onChange={setHeaderComponents}
          style={themeStyle}
        />
        <div className="flex items-center gap-2 h-5">
          {headerSaving && <Spinner className="h-4 w-4" />}
          {!headerSaving && headerSaved && (
            <p className="flex items-center gap-1 text-sm text-success">
              <CheckIcon className="h-4 w-4" /> Saved
            </p>
          )}
          {!headerSaving && headerError && (
            <Alert variant="danger" tone="soft" title={headerError} />
          )}
        </div>
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
          onSave={async (fd: FormData) => {
            setFooterSaving(true);
            setFooterError(null);
            setFooterSaved(false);
            try {
              const { data, error } = await apiRequest<{ id: string }>(
                `/cms/api/page-draft/${shopId}`,
                { method: "POST", body: fd },
              );
              if (data) {
                setFooterPageId(data.id);
                setFooterSaved(true);
                setToast({ open: true, message: "Footer saved" });
              } else if (error) {
                setFooterError(error);
              }
            } finally {
              setFooterSaving(false);
            }
          }}
          onPublish={async () => {}}
          saving={footerSaving}
          onChange={setFooterComponents}
          style={themeStyle}
        />
        <div className="flex items-center gap-2 h-5">
          {footerSaving && <Spinner className="h-4 w-4" />}
          {!footerSaving && footerSaved && (
            <p className="flex items-center gap-1 text-sm text-success">
              <CheckIcon className="h-4 w-4" /> Saved
            </p>
          )}
          {!footerSaving && footerError && (
            <Alert variant="danger" tone="soft" title={footerError} />
          )}
        </div>
      </div>

      {/* Additional step-specific UI ------------------------------------ */}
      {children}

      {/* Navigation ------------------------------------------------------ */}
      <div className="flex justify-end">
        <Button
          data-cy="save-return"
          onClick={handleReturn}
          disabled={headerSaving || footerSaving}
        >
          {(headerSaving || footerSaving) && (
            <Spinner className="me-2 h-4 w-4" />
          )}
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
