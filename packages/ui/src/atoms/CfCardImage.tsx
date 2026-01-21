// Copied from src/components/images/CfCardImage.tsx
import { type FC,memo } from "react";

import { type PRESETS } from "@acme/ui/config/imagePresets";

import { CfImage, type CfImageProps } from "./CfImage";

export interface CfCardImageProps extends Omit<CfImageProps, "preset"> {
  preset?: keyof typeof PRESETS;
  wrapperClassName?: string;
  caption?: string;
}

const CfCardImageComponent: FC<CfCardImageProps> = ({ preset = "thumb", wrapperClassName, caption, ...imgProps }) => (
  <figure className={wrapperClassName}>
    <CfImage {...imgProps} preset={preset} />
    {caption && <figcaption className="mt-1 text-center text-sm">{caption}</figcaption>}
  </figure>
);

export const CfCardImage = memo(CfCardImageComponent);
CfCardImage.displayName = "CfCardImage";
export default CfCardImage;
