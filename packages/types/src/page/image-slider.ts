import type { PageComponentBase } from "./base";

export interface ImageSliderComponent extends PageComponentBase {
  type: "ImageSlider";
  slides?: { src: string; alt?: string; caption?: string }[];
  minItems?: number;
  maxItems?: number;
}
