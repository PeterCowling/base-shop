import type { HeroBannerComponent } from "@acme/types";

import type { EditorProps } from "./EditorProps";
import { useArrayEditor } from "./useArrayEditor";

type Props = EditorProps<HeroBannerComponent>;

export default function HeroBannerEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<HeroBannerComponent>(onChange);
  return arrayEditor("slides", component.slides, ["src", "alt", "headlineKey", "ctaKey"], {
    minItems: component.minItems,
    maxItems: component.maxItems,
  });
}
