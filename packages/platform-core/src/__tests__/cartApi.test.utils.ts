/** @jest-environment node */

import type { NextRequest } from "next/server";
import { asNextJson } from "@acme/test-utils";

export const CART_COOKIE = "__Host-CART_ID";

export function mockCartCookie() {
  jest.doMock("../cartCookie", () => ({
    __esModule: true,
    CART_COOKIE,
    encodeCartCookie: (v: string) => v,
    decodeCartCookie: (v: string | null | undefined) => v,
    asSetCookieHeader: (v: string) => `${CART_COOKIE}=${v}`,
  }));
}

export function mockCartStore(overrides: Record<string, unknown> = {}) {
  jest.doMock("../cartStore", () => ({
    __esModule: true,
    createCart: jest.fn(async () => "new"),
    getCart: jest.fn(async () => ({})),
    setCart: jest.fn(),
    incrementQty: jest.fn(),
    setQty: jest.fn(),
    removeItem: jest.fn(),
    ...overrides,
  }));
}

export const buildRequest = (body: any, cookie?: string): NextRequest =>
  asNextJson(body, { cookies: cookie ? { [CART_COOKIE]: cookie } : undefined });

