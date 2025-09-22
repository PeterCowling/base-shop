import { RefObject } from "react";

// Expose autoscroll tuning so DevTools can visualize thresholds
export const AUTOSCROLL_EDGE_PX = 48;
export const AUTOSCROLL_MAX_SPEED_PX = 28;

function speedForDistance(d: number, edge: number, maxSpeed: number): number {
  const within = Math.max(0, edge - d);
  return within > 0 ? Math.ceil((within / edge) * maxSpeed) : 0;
}

export function autoScroll(
  scrollRef: RefObject<HTMLDivElement | null> | undefined,
  pageX: number,
  pageY: number,
  edge: number = AUTOSCROLL_EDGE_PX,
  maxSpeed: number = AUTOSCROLL_MAX_SPEED_PX
) {
  try {
    const sc = scrollRef?.current;
    if (!sc) return;
    const rect = sc.getBoundingClientRect();

    const topDist = Math.max(0, pageY - rect.top);
    const bottomDist = Math.max(0, rect.bottom - pageY);
    const leftDist = Math.max(0, pageX - rect.left);
    const rightDist = Math.max(0, rect.right - pageX);

    const vUp = speedForDistance(topDist, edge, maxSpeed);
    const vDown = speedForDistance(bottomDist, edge, maxSpeed);
    const vLeft = speedForDistance(leftDist, edge, maxSpeed);
    const vRight = speedForDistance(rightDist, edge, maxSpeed);

    if (vUp && pageY < rect.top + edge) sc.scrollBy({ top: -vUp, behavior: "auto" });
    else if (vDown && pageY > rect.bottom - edge) sc.scrollBy({ top: vDown, behavior: "auto" });
    if (vLeft && pageX < rect.left + edge) sc.scrollBy({ left: -vLeft, behavior: "auto" });
    else if (vRight && pageX > rect.right - edge) sc.scrollBy({ left: vRight, behavior: "auto" });
  } catch {
    // swallow
  }
}

