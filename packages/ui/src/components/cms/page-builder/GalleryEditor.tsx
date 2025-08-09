import type { PageComponent } from "@types";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function GalleryEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor(onChange);
  return arrayEditor(
    "images",
    (component as any).images,
    ["src", "alt"],
    {
      minItems: (component as any).minItems,
      maxItems: (component as any).maxItems,
    }
  );
}
