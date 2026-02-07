// src/utils/useDebounce.ts
// OPT-06: Query debouncing utility to prevent burst queries from rapid user actions

import { useEffect, useState } from 'react';

/**
 * Debounces a value, returning the latest value after the specified delay
 * has passed without new updates.
 *
 * Use this for search inputs, filter text, or any user input that triggers
 * expensive operations (network requests, heavy computations).
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 300);
 *
 * // Query only runs when user stops typing for 300ms
 * useEffect(() => {
 *   if (debouncedSearch) {
 *     searchActivities(debouncedSearch);
 *   }
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
