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
  shopLayout: string;
  setShopLayout: (v: string) => void;
  shopComponents: PageComponent[];
  setShopComponents: (v: PageComponent[]) => void;
  shopPageId: string | null;
  setShopPageId: (v: string | null) => void;
  shopId: string;
  themeStyle: React.CSSProperties;
  onBack: () => void;
  onNext: () => void;
}

export default function StepShopPage({
  pageTemplates,
  shopLayout,
  setShopLayout,
  shopComponents,
  setShopComponents,
  shopPageId,
  setShopPageId,
  shopId,
  themeStyle,
  onBack,
  onNext,
}: Props): React.JSX.Element {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Shop Page</h2>
      <Select
        value={shopLayout}
        onValueChange={(val) => {
          setShopLayout(val);
          const tpl = pageTemplates.find((t) => t.name === val);
          if (tpl) {
            setShopComponents(
              tpl.components.map((c) => ({ ...c, id: ulid() }))
            );
          } else {
            setShopComponents([]);
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
            id: shopPageId ?? "",
            slug: "",
            status: "draft",
            components: shopComponents,
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
          setShopPageId(json.id);
        }}
        onPublish={async () => {}}
        onChange={setShopComponents}
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
