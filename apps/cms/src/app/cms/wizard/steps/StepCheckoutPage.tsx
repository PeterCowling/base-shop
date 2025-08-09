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
import { LOCALES } from "@acme/i18n";
import type { Locale, Page, PageComponent } from "@types";
import { fetchJson } from "@ui/utils/fetchJson";
import { ulid } from "ulid";
import { useState } from "react";
import { Toast } from "@/components/atoms";

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
  onBack: () => void;
  onNext: () => void;
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
  onBack,
  onNext,
}: Props): React.JSX.Element {
  const [toast, setToast] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

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
              title: LOCALES.reduce(
                (acc, l) => ({ ...acc, [l]: "" }),
                {} as Record<Locale, string>
              ),
              description: LOCALES.reduce(
                (acc, l) => ({ ...acc, [l]: "" }),
                {} as Record<Locale, string>
              ),
              image: "",
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
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Next</Button>
      </div>
      <Toast
        open={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        message={toast.message}
      />
    </div>
  );
}
