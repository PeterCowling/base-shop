/* file path: src/components/images/CfHeroImage.tsx */
import { type FC,memo } from "react";

import { CfImage, type CfImageProps } from "@/components/images/CfImage";

export type CfHeroImageProps = Omit<CfImageProps, "preset">;

const CfHeroImageComponent: FC<CfHeroImageProps> = (props) => <CfImage {...props} preset="hero" />;

export const CfHeroImage = memo(CfHeroImageComponent);
CfHeroImage.displayName = "CfHeroImage";
export default CfHeroImage;
