import { useCallback, useRef } from "react";

export function useIframeShields(canvasRef?: React.RefObject<HTMLDivElement | null>) {
  const iframeShieldsRef = useRef<HTMLElement[]>([]);

  const addIframeShields = useCallback(() => {
    try {
      const root = canvasRef?.current ?? (typeof document !== 'undefined' ? document.getElementById('canvas') : null);
      if (!root) return;
      const iframes = root.querySelectorAll('iframe');
      const shields: HTMLElement[] = [];
      iframes.forEach((frame) => {
        const f = frame as HTMLElement;
        const r = f.getBoundingClientRect();
        const base = root.getBoundingClientRect();
        const shield = document.createElement('div');
        shield.className = 'pb-iframe-shield';
        const style: Partial<CSSStyleDeclaration> = {
          position: 'absolute',
          left: `${r.left - base.left}px`,
          top: `${r.top - base.top}px`,
          width: `${r.width}px`,
          height: `${r.height}px`,
          zIndex: '50',
          background: 'transparent',
          pointerEvents: 'auto',
        };
        Object.assign(shield.style, style as unknown as Record<string, string>);
        root.appendChild(shield);
        shields.push(shield);
      });
      iframeShieldsRef.current = shields;
    } catch {
      // ignore
    }
  }, [canvasRef]);

  const removeIframeShields = useCallback(() => {
    try {
      iframeShieldsRef.current.forEach((el) => el.parentElement?.removeChild(el));
    } catch {}
    iframeShieldsRef.current = [];
  }, []);

  return { addIframeShields, removeIframeShields } as const;
}

