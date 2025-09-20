import type { ImageComponent } from "@acme/types";
import React, { useCallback } from "react";
import ImageSourcePanel from "./ImageSourcePanel";

interface Props {
  component: ImageComponent;
  onChange: (patch: Partial<ImageComponent>) => void;
}

function ImageBlockEditor({ component, onChange }: Props) {
  const handleChange = useCallback(
    (patch: Partial<ImageComponent>) => {
      onChange(patch);
    },
    [onChange]
  );

  return (
    <ImageSourcePanel
      src={component.src}
      alt={component.alt}
      cropAspect={(component as any).cropAspect}
      focalPoint={(component as any).focalPoint}
      onChange={handleChange}
    />
  );
}

export default React.memo(ImageBlockEditor);
