"use client";

import { useSyncExternalStore } from "react";

export const ANALYTICS_CONSENT_COOKIE_NAME = "consent.analytics";
const COOKIE_ATTRS = "SameSite=Lax; Path=/; Max-Age=31536000";

function readCookieValue(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${ANALYTICS_CONSENT_COOKIE_NAME}=`));
  return match ? match.split("=")[1] ?? null : null;
}

let listeners: Array<() => void> = [];
let snapshot: string | null = readCookieValue();

export function emitAnalyticsConsentChange() {
  snapshot = readCookieValue();
  for (const listener of listeners) listener();
}

export function writeAnalyticsConsent(value: "true" | "false"): void {
  document.cookie = `${ANALYTICS_CONSENT_COOKIE_NAME}=${value}; ${COOKIE_ATTRS}`;
  emitAnalyticsConsentChange();
}

function subscribe(listener: () => void): () => void {
  listeners = [...listeners, listener];

  const cookieStore =
    typeof window !== "undefined" && "cookieStore" in window
      ? (window as unknown as { cookieStore: EventTarget }).cookieStore
      : null;

  const handleCookieChange = () => emitAnalyticsConsentChange();

  cookieStore?.addEventListener("change", handleCookieChange);
  if (typeof window !== "undefined") {
    window.addEventListener("visibilitychange", handleCookieChange);
  }

  return () => {
    listeners = listeners.filter((l) => l !== listener);
    cookieStore?.removeEventListener("change", handleCookieChange);
    if (typeof window !== "undefined") {
      window.removeEventListener("visibilitychange", handleCookieChange);
    }
  };
}

function getSnapshot(): string | null {
  snapshot = readCookieValue();
  return snapshot;
}

function getServerSnapshot(): string | null {
  return "server";
}

export function useAnalyticsConsentValue(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
