import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms-shadcn";
import PageBuilder from "@/components/cms/PageBuilder";
import { Locale, LOCALES, Page, PageComponent } from "@types";
import { ulid } from "ulid";

interface PageInfo {
  id?: string;
  slug: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  image: Record<Locale, string>;
  components: PageComponent[];
}

interface Props {
  pageTemplates: Array<{ name: string; components: PageComponent[] }>;
  pages: PageInfo[];
  setPages: (v: PageInfo[]) => void;
  newSlug: string;
  setNewSlug: (v: string) => void;
  newTitle: Record<Locale, string>;
  setNewTitle: (v: Record<Locale, string>) => void;
  newDesc: Record<Locale, string>;
  setNewDesc: (v: Record<Locale, string>) => void;
  newImage: Record<Locale, string>;
  setNewImage: (v: Record<Locale, string>) => void;
  newComponents: PageComponent[];
  setNewComponents: (v: PageComponent[]) => void;
  newDraftId: string | null;
  setNewDraftId: (v: string | null) => void;
  adding: boolean;
  setAdding: (v: boolean) => void;
  newPageLayout: string;
  setNewPageLayout: (v: string) => void;
  shopId: string;
  themeStyle: React.CSSProperties;
  onBack: () => void;
  onNext: () => void;
}

export default function StepAdditionalPages({
  pageTemplates,
  pages,
  setPages,
  newSlug,
  setNewSlug,
  newTitle,
  setNewTitle,
  newDesc,
  setNewDesc,
  newImage,
  setNewImage,
  newComponents,
  setNewComponents,
  newDraftId,
  setNewDraftId,
  adding,
  setAdding,
  newPageLayout,
  setNewPageLayout,
  shopId,
  themeStyle,
  onBack,
  onNext,
}: Props): React.JSX.Element {
  const languages = LOCALES as readonly Locale[];
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Additional Pages</h2>
      {pages.length > 0 && (
        <ul className="list-disc pl-5 text-sm">
          {pages.map((p) => (
            <li key={p.slug}>{p.slug}</li>
          ))}
        </ul>
      )}
      {adding && (
        <div className="space-y-2">
          <Select
            value={newPageLayout}
            onValueChange={(val) => {
              setNewPageLayout(val);
              const tpl = pageTemplates.find((t) => t.name === val);
              if (tpl) {
                setNewComponents(
                  tpl.components.map((c) => ({ ...c, id: ulid() }))
                );
              } else {
                setNewComponents([]);
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
          <label className="flex flex-col gap-1">
            <span>Slug</span>
            <Input
              value={newSlug}
              onChange={(e) => setNewSlug(e.target.value)}
            />
          </label>
          {languages.map((l) => (
            <div key={l} className="space-y-2">
              <label className="flex flex-col gap-1">
                <span>Title ({l})</span>
                <Input
                  value={newTitle[l]}
                  onChange={(e) =>
                    setNewTitle({ ...newTitle, [l]: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Description ({l})</span>
                <Input
                  value={newDesc[l]}
                  onChange={(e) =>
                    setNewDesc({ ...newDesc, [l]: e.target.value })
                  }
                />
              </label>
              <label className="flex flex-col gap-1">
                <span>Image URL ({l})</span>
                <Input
                  value={newImage[l]}
                  onChange={(e) =>
                    setNewImage({ ...newImage, [l]: e.target.value })
                  }
                />
              </label>
            </div>
          ))}
          <PageBuilder
            page={
              {
                id: newDraftId ?? "",
                slug: "",
                status: "draft",
                components: newComponents,
                seo: {
                  title: LOCALES.reduce(
                    (acc, l) => ({ ...acc, [l]: "" }),
                    {} as Record<Locale, string>
                  ),
                  description: LOCALES.reduce(
                    (acc, l) => ({ ...acc, [l]: "" }),
                    {} as Record<Locale, string>
                  ),
                  image: LOCALES.reduce(
                    (acc, l) => ({ ...acc, [l]: "" }),
                    {} as Record<Locale, string>
                  ),
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
              setNewDraftId(json.id);
            }}
            onPublish={async () => {}}
            onChange={setNewComponents}
            style={themeStyle}
          />
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setAdding(false);
                setNewDraftId(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setPages([
                  ...pages,
                  {
                    id: newDraftId ?? undefined,
                    slug: newSlug,
                    title: newTitle,
                    description: newDesc,
                    image: newImage,
                    components: newComponents,
                  },
                ]);
                setNewSlug("");
                const createEmptyLocaleRecord = () =>
                  languages.reduce(
                    (acc, l) => ({ ...acc, [l]: "" }),
                    {} as Record<Locale, string>
                  );
                setNewTitle(createEmptyLocaleRecord());
                setNewDesc(createEmptyLocaleRecord());
                setNewImage(createEmptyLocaleRecord());
                setNewComponents([]);
                setNewDraftId(null);
                setAdding(false);
              }}
            >
              Add Page
            </Button>
          </div>
        </div>
      )}
      {!adding && <Button onClick={() => setAdding(true)}>Add Page</Button>}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext}>Next</Button>
      </div>
    </div>
  );
}
