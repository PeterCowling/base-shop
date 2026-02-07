import type { ResizeAction } from "../state/layout/types";

export function createKeyboardNudge(args: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  widthVal?: string;
  heightVal?: string;
  widthKey: string;
  heightKey: string;
  componentId: string;
  dispatch: React.Dispatch<ResizeAction>;
  setKbResizing: (v: boolean) => void;
  setCurrent: (v: { width: number; height: number; left: number; top: number }) => void;
  disabled?: boolean;
}) {
  const {
    containerRef,
    widthVal,
    heightVal,
    widthKey,
    heightKey,
    componentId,
    dispatch,
    setKbResizing,
    setCurrent,
  } = args;

  const nudgeByKeyboard = (
    direction: "left" | "right" | "up" | "down",
    step: number
  ) => {
    if (args.disabled) return;
    const el = containerRef.current;
    if (!el) return;
    const startWidth = widthVal && widthVal.endsWith("px") ? parseFloat(widthVal) : el.offsetWidth;
    const startHeight = heightVal && heightVal.endsWith("px") ? parseFloat(heightVal) : el.offsetHeight;
    let newW = startWidth;
    let newH = startHeight;
    if (direction === "left") newW = Math.max(1, startWidth - step);
    if (direction === "right") newW = Math.max(1, startWidth + step);
    if (direction === "up") newH = Math.max(1, startHeight - step);
    if (direction === "down") newH = Math.max(1, startHeight + step);

    dispatch({
      type: "resize",
      id: componentId,
      [widthKey]: `${Math.round(newW)}px`,
      [heightKey]: `${Math.round(newH)}px`,
    });
    setCurrent({ width: newW, height: newH, left: el.offsetLeft, top: el.offsetTop });
    setKbResizing(true);
    // Clear the overlay shortly after key interaction
    window.clearTimeout((nudgeByKeyboard as unknown as { _t?: number })._t);
    (nudgeByKeyboard as unknown as { _t?: number })._t = window.setTimeout(() => setKbResizing(false), 300);
  };

  return nudgeByKeyboard;
}
