"use client";

import { Button } from "@ui/components/atoms/shadcn";
import ProductPageBuilder from "@/components/cms/ProductPageBuilder";
import { fillLocales } from "@i18n/fillLocales";
import { type Page, type PageComponent } from "@acme/types";
import { useState } from "react";
import { Toast } from "@ui/components/atoms";
import useStepCompletion from "../hooks/useStepCompletion";
import { useRouter } from "next/navigation";
import TemplateSelector from "@/app/cms/configurator/components/TemplateSelector";
import useProductPageData from "./hooks/useProductPageData";

interface Props {
  pageTemplates: Array<{
    id: string;
    name: string;
    components: PageComponent[];
    preview?: string | null;
    description?: string;
    category?: string;
    pageType?: string;
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

  const {
    saveDraft,
    publishPage,
    isSaving,
    isPublishing,
    saveError,
    publishError,
  } = useProductPageData({
    shopId,
    productPageId,
    setProductPageId: (v: string) => setProductPageId(v),
    setProductComponents,
    setToast,
  });

  const [, markComplete] = useStepCompletion("product-page");
  const router = useRouter();
  const hasTemplate = productLayout.trim().length > 0;
  const hasSavedAtLeastOnce = Boolean(productPageId);
  const canProceed = hasTemplate && hasSavedAtLeastOnce && productComponents.length > 0;
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Product Detail Page</h2>
      <TemplateSelector
        value={productLayout}
        pageTemplates={pageTemplates}
        allowBlank={false}
        onConfirm={(layout, comps) => {
          setProductLayout(layout);
          setProductComponents(comps);
        }}
      />
      <ProductPageBuilder
        page={
          {
            id: productPageId ?? "",
            slug: "",
            status: "draft",
            ...(productLayout ? { stableId: productLayout } : {}),
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
        onSave={saveDraft}
        onPublish={publishPage}
        saving={isSaving}
        publishing={isPublishing}
        saveError={saveError}
        publishError={publishError}
        onChange={setProductComponents}
        style={themeStyle}
      />
      <div className="flex justify-end">
        <Button
          data-cy="save-return"
          disabled={!canProceed}
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
