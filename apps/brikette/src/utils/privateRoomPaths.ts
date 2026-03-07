import type { PrivateRoomChildRouteId } from "@acme/ui/config/privateRoomChildSlugs";
import {
  getPrivateRoomChildPath as getSharedPrivateRoomChildPath,
  getPrivateRoomsPath as getSharedPrivateRoomsPath,
} from "@acme/ui/utils/privateRoomPaths";

import type { AppLanguage } from "@/i18n.config";

export function getPrivateRoomsPath(lang: AppLanguage): string {
  return `/${lang}${getSharedPrivateRoomsPath(lang)}`;
}

export function getPrivateRoomChildPath(
  lang: AppLanguage,
  routeId: PrivateRoomChildRouteId,
): string {
  return `/${lang}${getSharedPrivateRoomChildPath(lang, routeId)}`;
}
