import {
  getPrivateRoomChildSlug,
  type PrivateRoomChildRouteId,
} from "../config/privateRoomChildSlugs";
import type { AppLanguage } from "../i18n.config";

import { translatePath } from "./translate-path";

export function getPrivateRoomsPath(lang: AppLanguage): string {
  return `/${translatePath("privateBooking", lang)}`;
}

export function getPrivateRoomsSectionPath(lang: AppLanguage): string {
  return `/${translatePath("apartment", lang)}`;
}

export function getPrivateRoomChildPath(
  lang: AppLanguage,
  routeId: PrivateRoomChildRouteId,
): string {
  return `${getPrivateRoomsSectionPath(lang)}/${getPrivateRoomChildSlug(routeId, lang)}`;
}
