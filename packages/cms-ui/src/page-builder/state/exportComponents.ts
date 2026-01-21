import type { ExportedComponent as CoreExportedComponent } from "@acme/page-builder-core";
import { exportComponents as coreExportComponents } from "@acme/page-builder-core";
import type { HistoryState,PageComponent } from "@acme/types";

export type ExportedComponent = CoreExportedComponent;

/**
 * Legacy re-export for builder UI.
 * Delegates to the shared core helper in @acme/page-builder-core so
 * CMS and runtimes share a single implementation.
 */
export function exportComponents(
  list: PageComponent[],
  editor?: HistoryState["editor"],
  globals?: Record<string, PageComponent> | null,
): ExportedComponent[] {
  return coreExportComponents(list, editor, globals);
}
