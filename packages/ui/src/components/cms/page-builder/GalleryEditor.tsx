import type { GalleryComponent } from "@acme/types";
import { useArrayEditor } from "./useArrayEditor";
import { Checkbox } from "../../atoms/shadcn";
import type { EditorProps } from "./EditorProps";
import { useTranslations } from "@acme/i18n";
import type { CheckedState } from "@radix-ui/react-checkbox";

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
