import { useEffect, useState } from "react";

/**
 * Returns `true` after the component has mounted on the client.
 * Use to avoid hydration mismatches when rendering depends on client-only state.
 */
export function useHasMounted(): boolean {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  return hasMounted;
}
