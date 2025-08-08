import type { PageComponent } from "@types";
import { useArrayEditor } from "./useArrayEditor";

interface Props {
  component: PageComponent;
  onChange: (patch: Partial<PageComponent>) => void;
}

export default function HeroBannerEditor({ component, onChange }: Props) {
  const arrayEditor = useArrayEditor(onChange);
  return arrayEditor("slides", (component as any).slides, [
    "src",
    "alt",
    "headlineKey",
    "ctaKey",
  ]);
}
