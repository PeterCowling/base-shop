import type { PageComponent } from "@acme/types";

type HeroBannerComponent = Extract<PageComponent, { type: "HeroBanner" }>;
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
