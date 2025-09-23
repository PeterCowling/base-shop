import { jest } from "@jest/globals";
import type { NextRequest } from "next/server";
import { asNextJson } from "@acme/test-utils";

export const CART_COOKIE = "__Host-CART_ID";

export function mockCartCookie() {
  jest.doMock("../src/cartCookie", () => ({
    __esModule: true,
    CART_COOKIE,
    encodeCartCookie: (v: string) => v,
    decodeCartCookie: (v: string | null | undefined) => v,
    asSetCookieHeader: (v: string) => `${CART_COOKIE}=${v}`,
  }));
}

export function mockCartStore(overrides: Record<string, unknown> = {}) {
  jest.doMock("../src/cartStore", () => ({
    __esModule: true,
    createCart: jest.fn(),
    getCart: jest.fn(),
    setCart: jest.fn(),
    incrementQty: jest.fn(),
    setQty: jest.fn(),
    removeItem: jest.fn(),
    ...overrides,
  }));
}

// Helper to build request mocks
export const buildRequest = (body: any, cookie?: string): NextRequest =>
  asNextJson(body, { cookies: cookie ? { [CART_COOKIE]: cookie } : undefined });

