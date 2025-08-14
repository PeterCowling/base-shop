import { useState, useRef, useEffect } from "react";
import type { Action } from "./state";
import useGuides from "./useGuides";
import { snapToGrid } from "./gridSnap";

interface Options {
  componentId: string;
  dispatch: React.Dispatch<Action>;
  gridEnabled?: boolean;
  gridCols: number;
  containerRef: React.RefObject<HTMLDivElement>;
  disabled?: boolean;
}

export default function useCanvasDrag({
  componentId,
  dispatch,
  gridEnabled = false,
  gridCols,
  containerRef,
  disabled = false,
}: Options) {
  const moveRef = useRef<{ x: number; y: number; l: number; t: number } | null>(
    null
  );
  const [moving, setMoving] = useState(false);
  const [current, setCurrent] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });
  const { guides, setGuides, siblingEdgesRef, computeSiblingEdges } = useGuides(
    containerRef
  );

  useEffect(() => {
    if (!moving) return;
    const handleMove = (e: PointerEvent) => {
      if (!moveRef.current || !containerRef.current) return;
      const dx = e.clientX - moveRef.current.x;
      const dy = e.clientY - moveRef.current.y;
      let newL = moveRef.current.l + dx;
      let newT = moveRef.current.t + dy;
      const threshold = 10;
      let guideX: number | null = null;
      let guideY: number | null = null;
      const width = containerRef.current.offsetWidth;
      const height = containerRef.current.offsetHeight;
      siblingEdgesRef.current.vertical.forEach((edge) => {
        if (Math.abs(newL - edge) <= threshold) {
          newL = edge;
          guideX = edge;
        }
        if (Math.abs(newL + width - edge) <= threshold) {
          newL = edge - width;
          guideX = edge;
        }
      });
      siblingEdgesRef.current.horizontal.forEach((edge) => {
        if (Math.abs(newT - edge) <= threshold) {
          newT = edge;
          guideY = edge;
        }
        if (Math.abs(newT + height - edge) <= threshold) {
          newT = edge - height;
          guideY = edge;
        }
      });
      if (gridEnabled) {
        const parent = containerRef.current.parentElement;
        const unit = parent ? parent.offsetWidth / gridCols : null;
        if (unit) {
          newL = snapToGrid(newL, unit);
          newT = snapToGrid(newT, unit);
        }
      }
      dispatch({
        type: "resize",
        id: componentId,
        left: `${newL}px`,
        top: `${newT}px`,
      });
      setCurrent({ left: newL, top: newT, width, height });
      setGuides({
        x: guideX !== null ? guideX - newL : null,
        y: guideY !== null ? guideY - newT : null,
      });
    };
    const stop = () => {
      setMoving(false);
      setGuides({ x: null, y: null });
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stop);
    };
  }, [moving, componentId, dispatch, gridEnabled, gridCols, setGuides, siblingEdgesRef, containerRef]);

  const startDrag = (e: React.PointerEvent) => {
    if (disabled) return;
    const el = containerRef.current;
    if (!el) return;
    moveRef.current = {
      x: e.clientX,
      y: e.clientY,
      l: el.offsetLeft,
      t: el.offsetTop,
    };
    setCurrent({
      left: el.offsetLeft,
      top: el.offsetTop,
      width: el.offsetWidth,
      height: el.offsetHeight,
    });
    computeSiblingEdges();
    setMoving(true);
  };

  const snapping = guides.x !== null || guides.y !== null;

  return {
    startDrag,
    guides,
    snapping,
    moving,
    left: current.left,
    top: current.top,
    width: current.width,
    height: current.height,
  } as const;
}
