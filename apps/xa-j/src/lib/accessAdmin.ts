/* eslint-disable -- XA-0001 [ttl=2026-12-31] legacy access admin utilities pending security review */
import crypto from "node:crypto";
import type { NextResponse } from "next/server";

import { createAccessToken, verifyAccessToken } from "./accessTokens";
import {
  ADMIN_COOKIE_NAME,
  resolveAccessCookieSecret,
  resolveAdminToken,
} from "./stealth";

const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export async function validateAdminToken(token: string) {
  const expected = resolveAdminToken();
  if (!expected) return false;
  return safeEqual(token, expected);
}

export async function issueAdminSession(tokenSecret: string) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const exp = nowSeconds + ADMIN_SESSION_MAX_AGE;
  return createAccessToken({ kind: "admin", iat: nowSeconds, exp }, tokenSecret);
}

export async function hasAdminSession(request: Request) {
  const secret = resolveAccessCookieSecret();
  if (!secret) return false;
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`${ADMIN_COOKIE_NAME}=([^;]+)`));
  if (!match?.[1]) return false;
  try {
    const payload = await verifyAccessToken(match[1], secret);
    return payload?.kind === "admin";
  } catch {
    return false;
  }
}

export function setAdminCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: ADMIN_SESSION_MAX_AGE,
    path: "/",
  });
}

export function clearAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

export { ADMIN_SESSION_MAX_AGE };
