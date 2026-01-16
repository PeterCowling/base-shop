// Copied from src/components/images/CfCardImage.tsx
import { CfImage, type CfImageProps } from "./CfImage";
import { PRESETS } from "@ui/config/imagePresets";
import { memo, type FC } from "react";

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
