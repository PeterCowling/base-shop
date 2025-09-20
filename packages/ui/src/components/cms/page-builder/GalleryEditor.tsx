import type { GalleryComponent } from "@acme/types";
import { useArrayEditor } from "./useArrayEditor";
import { Checkbox } from "../../atoms/shadcn";

interface Props {
  component: GalleryComponent;
  onChange: (patch: Partial<GalleryComponent>) => void;
}

export default function GalleryEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<GalleryComponent>(onChange);
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={!!(component as any).openInLightbox}
          onCheckedChange={(v) => onChange({ openInLightbox: !!v } as Partial<GalleryComponent>)}
        />
        Open images in lightbox
      </label>
      {arrayEditor("images", component.images, ["src", "alt"], {
        minItems: (component as any).minItems,
        maxItems: (component as any).maxItems,
      })}
    </div>
  );
}
