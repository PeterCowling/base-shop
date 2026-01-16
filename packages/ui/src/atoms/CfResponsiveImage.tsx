// Copied from src/components/images/CfResponsiveImage.tsx
import { CfImage, type CfImageProps } from "./CfImage";
import { PRESETS } from "@ui/config/imagePresets";
import { memo, type FC } from "react";

export interface CfResponsiveImageProps extends Omit<CfImageProps, "preset"> {
  preset?: keyof typeof PRESETS;
}

const CfResponsiveImageComponent: FC<CfResponsiveImageProps> = ({ preset = "hero", ...imgProps }) => (
  <CfImage {...imgProps} preset={preset} />
);

export const CfResponsiveImage = memo(CfResponsiveImageComponent);
CfResponsiveImage.displayName = "CfResponsiveImage";
export default CfResponsiveImage;
