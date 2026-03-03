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
  badge?: { text: string; claimUrl: string };
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
  /** When true, renders the title as a gradient overlay at the top of the image instead of below it. */
  titleOverlay?: boolean;
  /** When provided, renders a "more details" link directly below the image. */
  detailHref?: string;
  detailLabel?: string;
}
