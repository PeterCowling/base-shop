// Shared type definitions for guide content extensions

import type { GuideContentInput } from "@acme/guide-system";

export interface GuideGalleryItem {
  src?: string;
  image?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  sizeKB?: number;
  size?: number;
  format?: string;
  type?: string;
}

export type GuideContentWithGallery = GuideContentInput & {
  gallery?: GuideGalleryItem[];
};
