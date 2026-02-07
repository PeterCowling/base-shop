import type { NextRequest } from "next/server";

import { asNextJson, jsonRequest } from "@acme/test-utils";

export function asNextRequest<T extends object>(
  body: T,
  options?: Parameters<typeof asNextJson>[1],
): NextRequest {
  return asNextJson(body, options) as unknown as NextRequest;
}

export function asNextRequestFromJson<T extends object>(
  body: T,
  options?: Parameters<typeof jsonRequest>[1],
): NextRequest {
  return jsonRequest(body, options) as unknown as NextRequest;
}
