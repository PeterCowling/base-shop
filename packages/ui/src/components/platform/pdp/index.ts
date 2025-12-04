import type { ComponentProps } from "react";
import type ImageGalleryComponent from "@acme/platform-core/components/pdp/ImageGallery";
import type SizeSelectorComponent from "@acme/platform-core/components/pdp/SizeSelector";

export { default as ImageGallery } from "@acme/platform-core/components/pdp/ImageGallery";
export type ImageGalleryProps = ComponentProps<ImageGalleryComponent>;

export { default as SizeSelector } from "@acme/platform-core/components/pdp/SizeSelector";
export type SizeSelectorProps = ComponentProps<SizeSelectorComponent>;
