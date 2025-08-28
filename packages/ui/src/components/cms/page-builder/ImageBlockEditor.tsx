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
      onChange={handleChange}
    />
  );
}

export default React.memo(ImageBlockEditor);
