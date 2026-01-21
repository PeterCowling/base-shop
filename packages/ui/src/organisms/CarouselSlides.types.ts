// Copied from src/components/accommodations-carousel/CarouselSlides.types.ts
import type { Room } from "@acme/ui/data/roomsData";
import type { AppLanguage } from "@acme/ui/i18n.config";

export interface CarouselSlidesProps {
  roomsData: Room[];
  openModalForRate: (room: Room, rateType: "nonRefundable" | "refundable") => void;
  lang?: AppLanguage;
}

