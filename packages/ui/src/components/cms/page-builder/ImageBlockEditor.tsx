import type { ImageComponent } from "@acme/types";
import ImageSourcePanel from "./ImageSourcePanel";

interface Props {
  component: ImageComponent;
  onChange: (patch: Partial<ImageComponent>) => void;
}

export default function ImageBlockEditor({ component, onChange }: Props) {
  const handleSrc = (src: string) => onChange({ src });
  const handleAlt = (alt: string) => onChange({ alt });

  return (
    <ImageSourcePanel
      src={component.src}
      alt={component.alt}
      onSrcChange={handleSrc}
      onAltChange={handleAlt}
    />
  );
}
