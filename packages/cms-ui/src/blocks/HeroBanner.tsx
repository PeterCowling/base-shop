import HeroBanner, { type Slide } from "@acme/ui/home/HeroBanner.client";

interface Props {
  slides?: Slide[];
  minItems?: number;
  maxItems?: number;
}

export default function CmsHeroBanner({
  slides = [],
  minItems,
  maxItems,
}: Props) {
  const list = slides.slice(0, maxItems ?? slides.length);
  if (!list.length || list.length < (minItems ?? 0)) return null;
  return <HeroBanner slides={list} />;
}
