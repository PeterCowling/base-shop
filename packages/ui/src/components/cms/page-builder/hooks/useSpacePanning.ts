"use client";

import React from "react";

/**
 * Enables panning the scroll container with spacebar/middle-click/alt-drag.
 * Single purpose: keyboard state + pointer handler to pan a scrollable ref.
 */
export default function useSpacePanning(scrollRef?: React.RefObject<HTMLDivElement | null>) {
  const [spacePanning, setSpacePanning] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpacePanning(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpacePanning(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const sc = scrollRef?.current;
      if (!sc) return;
      const enable = e.button === 1 || e.altKey || spacePanning;
      if (!enable) return;
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startScrollLeft = sc.scrollLeft;
      const startScrollTop = sc.scrollTop;
      const handleMove = (ev: PointerEvent) => {
        sc.scrollTo({ left: startScrollLeft - (ev.clientX - startX), top: startScrollTop - (ev.clientY - startY) });
      };
      const stop = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", stop);
      };
      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", stop);
    },
    [scrollRef, spacePanning]
  );

  return { onPointerDown } as const;
}

