"use client";

import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms-shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import { Locale, LOCALES, Page, PageComponent } from "@types";
import { ulid } from "ulid";

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
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Checkout Page</h2>
      <Select
        value={checkoutLayout}
        onValueChange={(val) => {
          setCheckoutLayout(val);
          const tpl = pageTemplates.find((t) => t.name === val);
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
          <SelectItem value="">Blank</SelectItem>
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
          const res = await fetch(`/cms/api/page-draft/${shopId}`, {
            method: "POST",
            body: fd,
          });
          const json = await res.json();
          setCheckoutPageId(json.id);
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
    </div>
  );
}
