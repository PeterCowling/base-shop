"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import { fillLocales } from "@i18n/fillLocales";
import type { Page, PageComponent } from "@acme/types";
import { fetchJson } from "@shared-utils";
import { ulid } from "ulid";
import { useState } from "react";
import { Toast } from "@/components/atoms";
import useStepCompletion from "../hooks/useStepCompletion";
import { StepControls } from "../steps";

interface Props {
  pageTemplates: Array<{ name: string; components: PageComponent[] }>;
  checkoutLayout: string;
  setCheckoutLayout: (v: string) => void;
  checkoutComponents: PageComponent[];
  setCheckoutComponents: (v: PageComponent[]) => void;
  checkoutPageId: string | null;
  setCheckoutPageId: (v: string | null) => void;
  shopId: string;
  themeStyle: React.CSSProperties;
  previousStepId?: string;
  nextStepId?: string;
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
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [, markComplete] = useStepCompletion("checkout-page");

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Checkout Page</h2>
      <Select
        value={checkoutLayout}
        onValueChange={(val) => {
          const layout = val === "blank" ? "" : val;
          setCheckoutLayout(layout);
          const tpl = pageTemplates.find((t) => t.name === layout);
          if (tpl) {
            setCheckoutComponents(
              tpl.components.map((c) => ({ ...c, id: ulid() }))
            );
          } else {
            setCheckoutComponents([]);
          }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select template" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="blank">Blank</SelectItem>
          {pageTemplates.map((t) => (
            <SelectItem key={t.name} value={t.name}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <PageBuilder
        page={
          {
            id: checkoutPageId ?? "",
            slug: "",
            status: "draft",
            components: checkoutComponents,
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
        onSave={async (fd) => {
          try {
            const json = await fetchJson<{ id: string }>(
              `/cms/api/page-draft/${shopId}`,
              {
                method: "POST",
                body: fd,
              }
            );
            setCheckoutPageId(json.id);
            setToast({ open: true, message: "Draft saved" });
          } catch {
            setToast({ open: true, message: "Failed to save page" });
          }
        }}
        onPublish={async () => {}}
        onChange={setCheckoutComponents}
        style={themeStyle}
      />
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
    </div>
  );
}
