import type { GuideCardImage } from "@/lib/guides/guideCardImage";

const GUIDE_CARD_IMAGE_FALLBACKS: Readonly<Record<string, GuideCardImage>> = {
  naplesAirportPositanoBus: {
    src: "/img/directions/naples-airport-positano-bus-bus-stop.png",
    alt: "Naples Airport Terminal 1 arrivals level showing Curreri bus stop signage",
  },
  travelHelp: {
    src: "/img/directions/positano-bus-stop.webp",
    alt: "Local bus stop area in Positano",
  },
};

export function getGuideCardImageFallback(contentKey: string): GuideCardImage | null {
  return GUIDE_CARD_IMAGE_FALLBACKS[contentKey] ?? null;
}
