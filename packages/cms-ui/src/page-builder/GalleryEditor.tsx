import type { CheckedState } from "@radix-ui/react-checkbox";

import { Checkbox } from "@acme/design-system/shadcn";
import { useTranslations } from "@acme/i18n";
import type { GalleryComponent } from "@acme/types";

import type { EditorProps } from "./EditorProps";
import { useArrayEditor } from "./useArrayEditor";

type Props = EditorProps<GalleryComponent>;

export default function GalleryEditor({ component, onChange }: Props) {
  const t = useTranslations();
  const arrayEditor = useArrayEditor<GalleryComponent>(onChange);
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={!!component.openInLightbox}
          onCheckedChange={(v: CheckedState) => onChange({ openInLightbox: v === true } as Partial<GalleryComponent>)}
        />
        {t("Open images in lightbox")}
      </label>
      {arrayEditor("images", component.images, ["src", "alt"], {
        minItems: component.minItems,
        maxItems: component.maxItems,
      })}
    </div>
  );
}
