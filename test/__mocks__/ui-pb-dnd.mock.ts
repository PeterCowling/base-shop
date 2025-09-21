import type { ComponentType } from "packages/ui/src/components/cms/page-builder/defaults";
import type { Action } from "packages/ui/src/components/cms/page-builder/state";

export default function usePageBuilderDnD({ dispatch }: { dispatch: (a: Action) => void }) {
  return {
    dndContext: {
      onDragStart: (_ev: any) => {},
      onDragMove: (_ev: any) => {},
      onDragEnd: (ev: any) => {
        const a = ev.active?.data?.current ?? {};
        const o = ev.over?.data?.current ?? {};
        if (a.from === "canvas") {
          const toIndex = o.index ?? 0;
          dispatch({ type: "move", from: { parentId: a.parentId, index: a.index }, to: { parentId: o.parentId ?? undefined, index: toIndex } } as any);
        }
      },
    },
    insertIndex: null,
    activeType: null as ComponentType | null,
  } as const;
}
