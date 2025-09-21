import type { HeroBannerComponent } from "@acme/types";
import { useArrayEditor } from "./useArrayEditor";
import type { EditorProps } from "./EditorProps";

type Props = EditorProps<HeroBannerComponent>;

export default function HeroBannerEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<HeroBannerComponent>(onChange);
  return arrayEditor("slides", component.slides, ["src", "alt", "headlineKey", "ctaKey"], {
    minItems: component.minItems,
    maxItems: component.maxItems,
  });
}
