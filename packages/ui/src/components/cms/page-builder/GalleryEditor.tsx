import type { GalleryComponent } from "@acme/types";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: GalleryComponent;
  onChange: (patch: Partial<GalleryComponent>) => void;
}

export default function GalleryEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<GalleryComponent>(onChange);
  return arrayEditor("images", component.images, ["src", "alt"], {
    minItems: component.minItems,
    maxItems: component.maxItems,
  });
}
