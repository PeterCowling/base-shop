import type { Room } from "../data/roomsData";
import type { AppLanguage } from "../i18n.config";
import type { RoomCardPrice } from "../types/roomCard";

export interface CarouselSlidesProps {
  roomsData: Room[];
  openModalForRate: (room: Room, rateType: "nonRefundable" | "refundable") => void;
  roomPrices?: Record<string, RoomCardPrice>;
  lang?: AppLanguage;
}
