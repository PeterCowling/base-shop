import type { ImageComponent } from "@acme/types";
import ImageSourcePanel from "./ImageSourcePanel";
import { memo } from "react";

interface Props {
  component: ImageComponent;
  onChange: (patch: Partial<ImageComponent>) => void;
}

function ImageBlockEditor({ component, onChange }: Props) {
  return <ImageSourcePanel component={component} onChange={onChange} />;
}

export default memo(ImageBlockEditor);
