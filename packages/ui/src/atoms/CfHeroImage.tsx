// Copied from src/components/images/CfHeroImage.tsx
import { CfImage, type CfImageProps } from "./CfImage";
import { memo, type FC } from "react";

export type CfHeroImageProps = Omit<CfImageProps, "preset">;

const CfHeroImageComponent: FC<CfHeroImageProps> = (props) => <CfImage {...props} preset="hero" />;

export const CfHeroImage = memo(CfHeroImageComponent);
CfHeroImage.displayName = "CfHeroImage";
export default CfHeroImage;
