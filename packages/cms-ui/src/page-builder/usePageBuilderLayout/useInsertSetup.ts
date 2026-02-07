// i18n-exempt -- Next.js directive literal (not user-facing copy)
"use client";

import type { PageComponent } from "@acme/types";
import useInsertHandlers from "@acme/ui/components/cms/page-builder/hooks/useInsertHandlers";

import type { Action } from "../state";
import useMediaLibraryListener from "../useMediaLibraryListener";

interface InsertSetupInput {
  components: PageComponent[];
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  insertIndex: number | null;
  insertParentId?: string | undefined;
  dispatch: (action: Action) => void;
  t: (key: string) => string;
}

export default function useInsertSetup({
  components,
  selectedIds,
  setSelectedIds,
  insertIndex,
  insertParentId,
  dispatch,
  t,
}: InsertSetupInput) {
  const handlers = useInsertHandlers({
    components,
    selectedIds,
    setSelectedIds,
    insertIndex,
    insertParentId,
    dispatch,
    t,
  });

  useMediaLibraryListener(handlers.mediaLibraryListener);

  return handlers;
}
