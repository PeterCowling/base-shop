import type { Dispatch, SetStateAction } from "react";
import CommandPalette from "./CommandPalette";
import GlobalsPanel from "./GlobalsPanel";
import PagesPanel from "./PagesPanel";
import CMSPanel from "./CMSPanel";
import type { PageBuilderLayoutProps } from "./PageBuilderLayout.types";

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
  fontsOpen,
  setFontsOpen,
  pagesOpen,
  setPagesOpen,
  cmsOpen,
  setCmsOpen,
  shop,
  pageId,
}: PageBuilderDialogsProps) => (
  <>
    <CommandPalette
      open={cmdOpen}
      onOpenChange={setCmdOpen}
      components={(canvasProps as any)?.components ?? []}
      selectedIds={(canvasProps as any)?.selectedIds ?? []}
      dispatch={(canvasProps as any)?.dispatch ?? (() => {})}
      onSelectIds={(canvasProps as any)?.onSelectIds ?? (() => {})}
    />
    <GlobalsPanel open={globalsOpen} onOpenChange={setGlobalsOpen} shop={shop ?? null} pageId={pageId ?? null} />
    {/* FontsPanel moved into left sidebar; dialog removed */}
    <PagesPanel open={pagesOpen} onOpenChange={setPagesOpen} shop={shop ?? null} />
    <CMSPanel
      open={cmsOpen}
      onOpenChange={setCmsOpen}
      components={(canvasProps as any)?.components ?? []}
      selectedIds={(canvasProps as any)?.selectedIds ?? []}
      onSelectIds={(canvasProps as any)?.onSelectIds ?? (() => {})}
    />
  </>
);

export default PageBuilderDialogs;
