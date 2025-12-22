import type { ComponentProps } from "react";
import ImageGallery from "@acme/platform-core/components/pdp/ImageGallery";
import SizeSelector from "@acme/platform-core/components/pdp/SizeSelector";

export { default as ImageGallery } from "@acme/platform-core/components/pdp/ImageGallery";
export type ImageGalleryProps = ComponentProps<typeof ImageGallery>;

export { default as SizeSelector } from "@acme/platform-core/components/pdp/SizeSelector";
export type SizeSelectorProps = ComponentProps<typeof SizeSelector>;
