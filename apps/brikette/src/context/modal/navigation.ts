/* eslint-disable ds/no-hardcoded-copy -- LINT-1007 [ttl=2026-12-31] Non-UI literals pending localization. */
// src/context/modal/navigation.ts
/* -------------------------------------------------------------------------- */
/*  Navigation helpers that tolerate missing router context                   */
/* -------------------------------------------------------------------------- */

import { useCallback, useContext, useMemo, useRef } from "react";
import { UNSAFE_NavigationContext } from "react-router";
import { useLocation, type Location, type NavigateFunction, type NavigateOptions, type To } from "react-router-dom";
import { IS_DEV } from "@/config/env";

const fallbackNavigate = ((to: To | number, options?: NavigateOptions) => {
  if (typeof window === "undefined") {
    return;
  }

  if (typeof to === "number") {
    window.history?.go?.(to);
    return;
  }

  const target = typeof to === "string" ? to : `${to.pathname ?? ""}${to.search ?? ""}${to.hash ?? ""}`;
  if (!target) {
    return;
  }

  if (options?.replace) {
    window.location.replace(target);
    return;
  }

  window.location.assign(target);
}) as NavigateFunction;

type NavigatorLike = Partial<{
  push: (to: To, options?: NavigateOptions) => void;
  replace: (to: To, options?: NavigateOptions) => void;
  navigate: (to: To, options?: NavigateOptions) => void;
  go: (delta: number) => void;
}>;

export function useSafeNavigate(): NavigateFunction {
  const navigation = useContext(UNSAFE_NavigationContext);
  const rawNavigator = navigation?.navigator as NavigatorLike | undefined;

  const fallbackNavigator = useMemo<NavigatorLike>(
    () => ({
      push: (to: To, options?: NavigateOptions) => fallbackNavigate(to, options),
      replace: (to: To, options?: NavigateOptions) => fallbackNavigate(to, { ...options, replace: true }),
      navigate: (to: To, options?: NavigateOptions) => fallbackNavigate(to, options),
      go: (delta: number) => fallbackNavigate(delta),
    }),
    [],
  );

  const warnedRef = useRef(false);
  const navigator = rawNavigator ?? fallbackNavigator;

  return useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        if (!rawNavigator && IS_DEV && !warnedRef.current && typeof window !== "undefined") {
          console.warn("[ModalContext] Falling back to window navigation outside router context");
          warnedRef.current = true;
        }
        if (typeof navigator.go === "function") {
          navigator.go(to);
        } else {
          fallbackNavigate(to);
        }
        return;
      }

      const methodName = options?.replace ? "replace" : "push";
      const method = navigator[methodName as "push" | "replace"];
      const target = typeof to === "string" ? to : `${to.pathname ?? ""}${to.search ?? ""}${to.hash ?? ""}`;
      if (!rawNavigator && IS_DEV && !warnedRef.current && typeof window !== "undefined" && target) {
        console.warn("[ModalContext] Falling back to window navigation outside router context");
        warnedRef.current = true;
      }
      if (typeof method === "function") {
        method(to, options);
        return;
      }

      if (typeof navigator.navigate === "function") {
        navigator.navigate(to, options);
        return;
      }

      fallbackNavigate(to, options);
    },
    [navigator, rawNavigator],
  );
}

export function useSafeLocation(): Location {
  try {
    return useLocation();
  } catch (error) {
    if (
      error instanceof Error &&
      typeof error.message === "string" &&
      error.message.includes("useLocation() may be used only in the context of a <Router>")
    ) {
      const locationLike = (() => {
        if (typeof window !== "undefined" && window.location) {
          return window.location;
        }

        if (typeof globalThis !== "undefined" && "location" in globalThis && globalThis.location) {
          return globalThis.location;
        }

        return undefined;
      })();

      const fallback: Location = {
        pathname: locationLike?.pathname ?? "/",
        search: locationLike?.search ?? "",
        hash: locationLike?.hash ?? "",
        state: null,
        key: "fallback",
      };
      if (IS_DEV) {
        console.warn("[ModalContext] Using window location outside router context");
      }
      return fallback;
    }
    throw error;
  }
}
