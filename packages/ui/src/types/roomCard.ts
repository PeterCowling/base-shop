import type { ReactNode } from "react";

export interface RoomCardFacility {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface RoomCardPrice {
  loading?: boolean;
  formatted?: string;
  loadingLabel?: string;
  skeletonTestId?: string;
  soldOut?: boolean;
  soldOutLabel?: string;
  info?: string;
}

export interface RoomCardAction {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

export interface RoomCardImageLabels {
  enlarge: string;
  prevAria: string;
  nextAria: string;
  empty?: string;
}

export interface RoomCardFullscreenRequest {
  image: string;
  index: number;
  title: string;
}

export interface RoomCardProps {
  id: string;
  title: string;
  images?: string[];
  imageAlt: string;
  imageLabels?: RoomCardImageLabels;
  facilities?: RoomCardFacility[];
  price?: RoomCardPrice;
  actions?: RoomCardAction[];
  className?: string;
  lang?: string;
  onRequestFullscreen?: (payload: RoomCardFullscreenRequest) => void;
}
