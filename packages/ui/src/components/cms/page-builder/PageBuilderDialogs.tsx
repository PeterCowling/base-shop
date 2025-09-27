import type { Dispatch, SetStateAction } from "react";
import CommandPalette from "./CommandPalette";
import GlobalsPanel from "./GlobalsPanel";
import PagesPanel from "./PagesPanel";
import CMSPanel from "./CMSPanel";
import type { PageBuilderLayoutProps } from "./PageBuilderLayout.types";
import type { Action as LayoutAction } from "./state/layout/types";

type CanvasProps = PageBuilderLayoutProps["canvasProps"];

type Setter = Dispatch<SetStateAction<boolean>>;

interface PageBuilderDialogsProps {
  cmdOpen: boolean;
  setCmdOpen: Setter;
  canvasProps: CanvasProps;
  globalsOpen: boolean;
  setGlobalsOpen: Setter;
  fontsOpen: boolean;
  setFontsOpen: Setter;
  pagesOpen: boolean;
  setPagesOpen: Setter;
  cmsOpen: boolean;
  setCmsOpen: Setter;
  shop?: string | null;
  pageId?: string | null;
}

const PageBuilderDialogs = ({
  cmdOpen,
  setCmdOpen,
  canvasProps,
  globalsOpen,
  setGlobalsOpen,
  fontsOpen: _fontsOpen,
  setFontsOpen: _setFontsOpen,
  pagesOpen,
  setPagesOpen,
  cmsOpen,
  setCmsOpen,
  shop,
  pageId,
}: PageBuilderDialogsProps) => {
  const components = canvasProps.components;
  const selectedIds = canvasProps.selectedIds ?? [];
  const onSelectIds = canvasProps.onSelectIds ?? (() => {});
  const dispatch: Dispatch<LayoutAction> = (canvasProps.dispatch as Dispatch<LayoutAction>) ?? ((() => {}) as Dispatch<LayoutAction>);

  return (
    <>
      <CommandPalette
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        components={components}
        selectedIds={selectedIds}
        dispatch={dispatch}
        onSelectIds={onSelectIds}
      />
      <GlobalsPanel open={globalsOpen} onOpenChange={setGlobalsOpen} shop={shop ?? null} pageId={pageId ?? null} />
      {/* FontsPanel moved into left sidebar; dialog removed */}
      <PagesPanel open={pagesOpen} onOpenChange={setPagesOpen} shop={shop ?? null} />
      <CMSPanel
        open={cmsOpen}
        onOpenChange={setCmsOpen}
        components={components}
        selectedIds={selectedIds}
        onSelectIds={onSelectIds}
      />
    </>
  );
};

export default PageBuilderDialogs;
