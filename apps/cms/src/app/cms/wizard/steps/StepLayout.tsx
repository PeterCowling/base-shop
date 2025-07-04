"use client";

import { Button } from "@/components/atoms-shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import { Locale, LOCALES, Page, PageComponent } from "@types";

interface Props {
  headerComponents: PageComponent[];
  setHeaderComponents: (v: PageComponent[]) => void;
  headerPageId: string | null;
  setHeaderPageId: (v: string | null) => void;
  footerComponents: PageComponent[];
  setFooterComponents: (v: PageComponent[]) => void;
  footerPageId: string | null;
  setFooterPageId: (v: string | null) => void;
  shopId: string;
  themeStyle: React.CSSProperties;
  onBack: () => void;
  onNext: () => void;
}

export default function StepLayout({
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
}: Props): React.JSX.Element {
  const emptyTranslated = () =>
    LOCALES.reduce(
      (acc, l) => ({ ...acc, [l]: "" }),
      {} as Record<Locale, string>
    );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Layout</h2>
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
            setHeaderPageId(json.id);
          }}
          onPublish={async () => {}}
          onChange={setHeaderComponents}
          style={themeStyle}
        />
      </div>
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
            setFooterPageId(json.id);
          }}
          onPublish={async () => {}}
          onChange={setFooterComponents}
          style={themeStyle}
        />
      </div>
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </div>
  );
}
