import { Input } from "@/components/atoms/shadcn";
import type { Locale } from "@acme/types";

interface Props {
  languages: readonly Locale[];
  slug: string;
  setSlug: (v: string) => void;
  title: Record<Locale, string>;
  setTitle: (v: Record<Locale, string>) => void;
  desc: Record<Locale, string>;
  setDesc: (v: Record<Locale, string>) => void;
  image: Record<Locale, string>;
  setImage: (v: Record<Locale, string>) => void;
}

export default function PageMetaForm({
  languages,
  slug,
  setSlug,
  title,
  setTitle,
  desc,
  setDesc,
  image,
  setImage,
}: Props) {
  return (
    <>
      <label className="flex flex-col gap-1">
        <span>Slug</span>
        <Input
          value={slug}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSlug(e.target.value)
          }
        />
      </label>
      {languages.map((l) => (
        <div key={l} className="space-y-2">
          <label className="flex flex-col gap-1">
            <span>Title ({l})</span>
            <Input
              value={title[l]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle({ ...title, [l]: e.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Description ({l})</span>
            <Input
              value={desc[l]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDesc({ ...desc, [l]: e.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Image URL ({l})</span>
            <Input
              value={image[l]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setImage({ ...image, [l]: e.target.value })
              }
            />
          </label>
        </div>
      ))}
    </>
  );
}

