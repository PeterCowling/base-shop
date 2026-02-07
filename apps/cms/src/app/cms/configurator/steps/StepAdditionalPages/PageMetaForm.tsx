import type { Locale } from "@acme/types";

import { Input } from "@/components/atoms/shadcn";

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
          data-cy="additional-page-slug"
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
              data-cy={`additional-page-title-${l}`}
              value={title[l]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setTitle({ ...title, [l]: e.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Description ({l})</span>
            <Input
              data-cy={`additional-page-desc-${l}`}
              value={desc[l]}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setDesc({ ...desc, [l]: e.target.value })
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Image URL ({l})</span>
            <Input
              data-cy={`additional-page-image-${l}`}
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

