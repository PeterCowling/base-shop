import type { NextResponse } from "next/server";

import { createAccessToken, verifyAccessToken } from "./accessTokens";
import { readCookieValue } from "./httpCookies";
import { resolveAccessCookieSecret } from "./stealth";

export const ACCOUNT_COOKIE_NAME = "xa_account";
export const ACCOUNT_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

type AccountSession = {
  userId: string;
  email: string;
};

export async function issueAccountSession(
  userId: string,
  email: string,
  tokenSecret?: string,
) {
  const secret = tokenSecret ?? resolveAccessCookieSecret();
  if (!secret) {
    throw new Error("Account session secret is not configured.");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const exp = nowSeconds + ACCOUNT_SESSION_MAX_AGE;
  return createAccessToken(
    {
      kind: "account",
      iat: nowSeconds,
      exp,
      sub: userId,
      email,
    },
    secret,
  );
}

export async function readAccountSession(request: Request): Promise<AccountSession | null> {
  const secret = resolveAccessCookieSecret();
  if (!secret) return null;

  const token = readCookieValue(request.headers.get("cookie"), ACCOUNT_COOKIE_NAME);
  if (!token) return null;

  try {
    const payload = await verifyAccessToken(token, secret);
    if (!payload || payload.kind !== "account") return null;
    return {
      userId: payload.sub,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export function setAccountCookie(response: NextResponse, token: string) {
  response.cookies.set(ACCOUNT_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: ACCOUNT_SESSION_MAX_AGE,
    path: "/",
  });
}

export function clearAccountCookie(response: NextResponse) {
  response.cookies.set(ACCOUNT_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
}

export type { AccountSession };
