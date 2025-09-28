import { useEffect, useState } from "react";
import useDropHighlight from "../hooks/useDropHighlight";

export function useDropHighlightState(params: Parameters<typeof useDropHighlight>[0]) {
  const { dropRect: dropRectLocal, handleDragOver, clearHighlight } = useDropHighlight(params);
  const [dropRect, setDropRectState] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  useEffect(() => { setDropRectState(dropRectLocal); }, [dropRectLocal]);

  return { dropRect, handleDragOver, clearHighlight } as const;
}

