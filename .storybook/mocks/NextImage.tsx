import * as React from 'react';

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt?: string;
  fill?: boolean;
  sizes?: string;
};

export default function NextImage({ src, alt = '', style, fill, ...rest }: Props) {
  const finalStyle = fill ? { ...style, width: '100%', height: '100%', objectFit: 'cover' } : style;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} style={finalStyle} {...rest} />;
}

