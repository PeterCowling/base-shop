export type Viewport = "desktop" | "tablet" | "mobile";
export interface LogoImage {
  src: string;
  width?: number;
  height?: number;
}
export type LogoVariants = Partial<Record<Viewport, LogoImage>>;
