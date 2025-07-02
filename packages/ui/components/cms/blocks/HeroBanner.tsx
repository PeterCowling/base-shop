import HeroBanner, { type Slide } from "../../home/HeroBanner.client";

export default function CmsHeroBanner(props: { slides?: Slide[] }) {
  return <HeroBanner {...props} />;
}
