import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms-shadcn";
import ProductPageBuilder from "@/components/cms/ProductPageBuilder";
import { Locale, LOCALES, Page, PageComponent } from "@types";
import { ulid } from "ulid";

interface Props {
  pageTemplates: Array<{ name: string; components: PageComponent[] }>;
  productLayout: string;
  setProductLayout: (v: string) => void;
  productComponents: PageComponent[];
  setProductComponents: (v: PageComponent[]) => void;
  productPageId: string | null;
  setProductPageId: (v: string | null) => void;
  shopId: string;
  themeStyle: React.CSSProperties;
  onBack: () => void;
  onNext: () => void;
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
  onBack,
  onNext,
}: Props): React.JSX.Element {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Product Detail Page</h2>
      <Select
        value={productLayout}
        onValueChange={(val) => {
          setProductLayout(val);
          const tpl = pageTemplates.find((t) => t.name === val);
          if (tpl) {
            setProductComponents(
              tpl.components.map((c) => ({ ...c, id: ulid() }))
            );
          } else {
            setProductComponents([]);
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
      <ProductPageBuilder
        page={
          {
            id: productPageId ?? "",
            slug: "",
            status: "draft",
            components: productComponents,
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
          setProductPageId(json.id);
        }}
        onPublish={async () => {}}
        onChange={setProductComponents}
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
