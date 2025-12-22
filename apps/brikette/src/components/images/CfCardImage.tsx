/* file path: src/components/images/CfCardImage.tsx */
import { CfImage, type CfImageProps } from "@/components/images/CfImage";
import { PRESETS } from "@/config/imagePresets";
import { memo, type FC } from "react";

export interface CfCardImageProps extends Omit<CfImageProps, "preset"> {
  /** Image preset key from `PRESETS`; defaults to `thumb` */
  preset?: keyof typeof PRESETS;
  /** Optional CSS class for the outer `<figure>` wrapper */
  wrapperClassName?: string;
  /** Visible caption displayed below the image */
  caption?: string;
}

const CfCardImageComponent: FC<CfCardImageProps> = ({
  preset = "thumb",
  wrapperClassName,
  caption,
  ...imgProps
}) => (
  <figure className={wrapperClassName}>
    <CfImage {...imgProps} preset={preset} />
    {caption && <figcaption className="mt-1 text-center text-sm">{caption}</figcaption>}
  </figure>
);

export const CfCardImage = memo(CfCardImageComponent);
CfCardImage.displayName = "CfCardImage";
export default CfCardImage;
