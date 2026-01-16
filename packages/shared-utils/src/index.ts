/* istanbul ignore file */
export { fetchJson } from "./fetchJson";
export { default as slugify } from "./slugify";
export { genSecret } from "./genSecret";
export { toggleItem } from "./toggleItem";
export { getCsrfToken } from "./getCsrfToken";
export { parseJsonBody, parseLimit } from "./parseJsonBody";
export { jsonFieldHandler, type ErrorSetter } from "./jsonFieldHandler";
export { formatCurrency } from "./formatCurrency";
export { formatPrice } from "./formatPrice";
export { formatNumber } from "./formatNumber";
export { logger } from "./logger";
export type { LogMeta } from "./logger";
export {
  getRequestContext,
  setRequestContext,
  withRequestContext,
} from "./requestContext";
export type { RequestContext, EnvLabel } from "./requestContext";
export { getShopFromPath } from "./getShopFromPath";
export { replaceShopInPath } from "./replaceShopInPath";
export { buildResponse } from "./buildResponse";
export {
  SHOP_ID_HEADER,
  REQUEST_ID_HEADER,
  getShopIdFromHeaders,
  requireShopIdFromHeaders,
  getRequestIdFromHeaders,
  getOrCreateRequestId,
  stripSpoofableShopHeaders,
} from "./shopContext";
