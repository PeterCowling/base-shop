export function isPointerEvent(
  ev: Event | null | undefined
): ev is PointerEvent {
  return !!ev && "clientX" in ev && "clientY" in ev;
}

export function safeDispatchEvent(name: string, detail?: any) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    window.dispatchEvent(new CustomEvent(name, { detail }));
  } catch {
    // no-op
  }
}

