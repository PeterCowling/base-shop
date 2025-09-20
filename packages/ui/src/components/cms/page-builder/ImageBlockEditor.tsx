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
    <div className="space-y-2">
      <ImageSourcePanel
        src={component.src}
        alt={component.alt}
        cropAspect={(component as any).cropAspect}
        focalPoint={(component as any).focalPoint}
        onChange={handleChange}
      />
      <p className="text-xs text-muted-foreground">
        Tip: When the image block is selected on the canvas, drag the focal point dot to adjust framing.
      </p>
    </div>
  );
}

export default React.memo(ImageBlockEditor);
