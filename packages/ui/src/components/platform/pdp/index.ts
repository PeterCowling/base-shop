import type { ComponentProps } from "react";

import type ImageGallery from "@acme/platform-core/components/pdp/ImageGallery";
import type SizeSelector from "@acme/platform-core/components/pdp/SizeSelector";

export { default as ImageGallery } from "@acme/platform-core/components/pdp/ImageGallery";
export type ImageGalleryProps = ComponentProps<typeof ImageGallery>;

export { default as SizeSelector } from "@acme/platform-core/components/pdp/SizeSelector";
export type SizeSelectorProps = ComponentProps<typeof SizeSelector>;
