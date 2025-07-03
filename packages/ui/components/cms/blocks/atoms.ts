export function Text({
  text = "",
  tag = "p",
}: {
  text?: string;
  tag?: keyof JSX.IntrinsicElements;
}) {
  const Comp = tag as keyof JSX.IntrinsicElements;
  return <Comp>{text}</Comp>;
}

export function Image({
  src,
  alt = "",
  width,
  height,
}: {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}) {
  if (!src) return null;
  return <img src={src} alt={alt} width={width} height={height} />;
}

export const atomRegistry = {
  Text,
  Image,
} as const;

export type AtomBlockType = keyof typeof atomRegistry;
