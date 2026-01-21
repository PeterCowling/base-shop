// src/components/images/CfResponsiveImage.tsx
import { type FC,memo } from "react";

import { CfImage, type CfImageProps } from "@/components/images/CfImage";
import { type PRESETS } from "@/config/imagePresets";

export interface CfResponsiveImageProps extends Omit<CfImageProps, "preset"> {
  preset?: keyof typeof PRESETS;
}

const CfResponsiveImageComponent: FC<CfResponsiveImageProps> = ({
  preset = "hero",
  ...imgProps
}) => <CfImage {...imgProps} preset={preset} />;

export const CfResponsiveImage = memo(CfResponsiveImageComponent);
CfResponsiveImage.displayName = "CfResponsiveImage";
export default CfResponsiveImage;
