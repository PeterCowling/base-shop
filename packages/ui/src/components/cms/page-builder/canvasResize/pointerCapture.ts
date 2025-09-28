export interface CaptureRef {
  current: { el: Element | null; id: number | null };
}

export function setPointerCaptureSafe(
  e: React.PointerEvent,
  captureRef: CaptureRef
) {
  try {
    const isTest = typeof process !== "undefined" && process.env.NODE_ENV === "test";
    if (!isTest) {
      (e.target as Element)?.setPointerCapture?.(e.pointerId);
      captureRef.current = { el: e.target as Element, id: e.pointerId };
    }
  } catch {}
}

export function releasePointerCaptureSafe(captureRef: CaptureRef) {
  try {
    if (captureRef.current?.el && captureRef.current?.id != null) {
      (captureRef.current.el as unknown as { releasePointerCapture?: (id: number) => void }).releasePointerCapture?.(
        captureRef.current.id
      );
    }
  } catch {}
  captureRef.current = { el: null, id: null };
}

