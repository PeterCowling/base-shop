import type { HeroBannerComponent } from "@acme/types/src/page/organisms";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: HeroBannerComponent;
  onChange: (patch: Partial<HeroBannerComponent>) => void;
}

export default function HeroBannerEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor<HeroBannerComponent>(onChange);
  return arrayEditor("slides", component.slides, ["src", "alt", "headlineKey", "ctaKey"], {
    minItems: component.minItems,
    maxItems: component.maxItems,
  });
}
