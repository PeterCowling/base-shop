import Image, { type ImageProps } from "next/image";
import * as React from "react";
import { cn } from "../../utils/style";

export interface LogoSource {
  srcSet: string;
  media?: string;
  type?: string;
}

export interface LogoProps extends Omit<ImageProps, "alt"> {
  /** Text shown when no image source is provided */
  fallbackText: string;
  /** Optional `<source>` elements for a `<picture>` wrapper */
  sources?: LogoSource[];
  /** Optional `srcset` for the underlying `img` tag */
  srcSet?: string;
  /** Image alt text, defaults to `fallbackText` */
  alt?: string;
}

export const Logo = React.forwardRef<HTMLImageElement, LogoProps>(
  (
    {
      className,
      src,
      alt,
      fallbackText,
      width = 32,
      height = 32,
      sources,
      srcSet,
      sizes,
      ...props
    },
    ref
  ) => {
    if (!src) {
      return <span className={cn("font-bold", className)}>{fallbackText}</span>;
    }
    const widthClass = `w-[${width}px]`;
    const heightClass = `h-[${height}px]`;
    const Img: any = Image;
    const img = (
      <Img
        ref={ref}
        src={src}
        alt={alt ?? fallbackText}
        width={width}
        height={height}
        className={cn(widthClass, heightClass, className)}
        srcSet={srcSet}
        sizes={sizes}
        {...props}
      />
    );

    if (sources && sources.length > 0) {
      return (
        <picture>
          {sources.map(({ srcSet: s, media, type }, i) => (
            <source key={i} srcSet={s} media={media} type={type} />
          ))}
          {img}
        </picture>
      );
    }

    return img;
  }
);
Logo.displayName = "Logo";
