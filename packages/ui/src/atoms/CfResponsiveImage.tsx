// Copied from src/components/images/CfResponsiveImage.tsx
import { type FC,memo } from "react";

import { type PRESETS } from "@acme/ui/config/imagePresets";

import { CfImage, type CfImageProps } from "./CfImage";

export interface CfResponsiveImageProps extends Omit<CfImageProps, "preset"> {
  preset?: keyof typeof PRESETS;
}

const CfResponsiveImageComponent: FC<CfResponsiveImageProps> = ({ preset = "hero", ...imgProps }) => (
  <CfImage {...imgProps} preset={preset} />
);

export const CfResponsiveImage = memo(CfResponsiveImageComponent);
CfResponsiveImage.displayName = "CfResponsiveImage";
export default CfResponsiveImage;
