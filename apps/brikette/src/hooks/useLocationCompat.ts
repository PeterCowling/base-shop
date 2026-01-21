// src/hooks/useLocationCompat.ts
//
// Bridge hook for migrating from react-router useLocation.
// NOTE: Does not provide hash - use window.location.hash in useEffect if needed.
// --------------------------------------------------------------------------
"use client";

import { usePathname, useSearchParams } from "next/navigation";

/**
 * Compatibility hook that provides a react-router-like location object.
 * Used during migration from react-router to next/navigation.
 *
 * Differences from react-router's useLocation:
 * - hash: Not available server-side. Use window.location.hash in useEffect if needed.
 * - state: Not supported. Use query params or component state instead.
 * - key: Not supported. Use pathname + search as cache key if needed.
 */
export function useLocationCompat() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return {
    pathname: pathname ?? "",
    search: searchParams?.toString() ? `?${searchParams.toString()}` : "",
    // hash: not available server-side, use window.location.hash in useEffect if needed
  };
}
