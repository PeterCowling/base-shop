declare module "@acme/ui/components/atoms/Logo" {
  import * as React from "react";

  type Viewport = "desktop" | "tablet" | "mobile";

  interface LogoSource {
    src: string;
    width?: number;
    height?: number;
  }

  export interface LogoProps
    extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
    fallbackText: string;
    src?: string;
    sources?: Partial<Record<Viewport, LogoSource>>;
    width?: number;
    height?: number;
    alt?: string;
    srcSet?: string;
  }

  export const Logo: React.FC<LogoProps>;
}
