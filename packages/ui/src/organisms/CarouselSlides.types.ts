import type { Room } from "../data/roomsData";
import type { AppLanguage } from "../i18n.config";

export interface CarouselSlidesProps {
  roomsData: Room[];
  openModalForRate: (room: Room, rateType: "nonRefundable" | "refundable") => void;
  lang?: AppLanguage;
}

