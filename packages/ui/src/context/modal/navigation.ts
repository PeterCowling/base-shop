// src/context/modal/navigation.ts
/* -------------------------------------------------------------------------- */
/*  Navigation helpers for Next.js App Router                                 */
/* -------------------------------------------------------------------------- */

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type Location = {
  pathname: string;
  search: string;
  hash: string;
  state: unknown;
  key: string;
};

export type To = string | Partial<Pick<Location, "pathname" | "search" | "hash">>;

export type NavigateOptions = {
  replace?: boolean;
  state?: unknown;
  scroll?: boolean;
};

export type NavigateFunction = (to: To | number, options?: NavigateOptions) => void;

export function useSafeNavigate(): NavigateFunction {
  const router = useRouter();

  return useCallback(
    (to: To | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        if (to === -1) {
          router.back();
        } else if (to === 1) {
          router.forward();
        } else {
          // Next.js doesn't support arbitrary history.go(n), fall back to window
          if (typeof window !== "undefined") {
            window.history?.go?.(to);
          }
        }
        return;
      }

      const target = typeof to === "string" ? to : `${to.pathname ?? ""}${to.search ?? ""}${to.hash ?? ""}`;
      if (!target) {
        return;
      }

      if (options?.replace) {
        router.replace(target, { scroll: options?.scroll });
      } else {
        router.push(target, { scroll: options?.scroll });
      }
    },
    [router],
  );
}

export function useSafeLocation(): Location {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const search = searchParams?.toString() ? `?${searchParams.toString()}` : "";
  const hash = typeof window !== "undefined" ? window.location.hash : "";

  return {
    pathname: pathname ?? "/",
    search,
    hash,
    state: null,
    key: "default",
  };
}
