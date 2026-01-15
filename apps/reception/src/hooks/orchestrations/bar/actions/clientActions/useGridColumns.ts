/* File: /src/hooks/orchestrations/bar/actions/clientActions/useGridColumns.ts */

import { useMemo } from "react";

/**
 * Client Hook:
 * Returns how many columns the ProductGrid should have.
 * Hard-coded to 6 wide, as requested.
 */
export default function useGridColumns(): number {
  // Simply return 6. Or adapt if needed for responsiveness.
  const columns = useMemo(() => 6, []);
  return columns;
}
