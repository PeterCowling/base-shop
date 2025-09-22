import { useEffect } from "react";

export function useAltClickCreate(
  canvasRef: React.RefObject<HTMLDivElement | null>,
  create: (componentId: string, text: string, extra?: { pos?: { x: number; y: number } }) => Promise<{ ok: boolean; json: any }> | { ok: boolean; json: any },
  onAfterCreate: () => void | Promise<void>
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handler = async (e: MouseEvent) => {
      if (!(e instanceof MouseEvent)) return;
      if (!e.altKey || e.button !== 0) return; // alt+left click only
      const target = (e.target as HTMLElement | null)?.closest('[data-component-id]') as HTMLElement | null;
      if (!target) return;
      const compId = target.getAttribute('data-component-id');
      if (!compId) return;
      const rect = target.getBoundingClientRect();
      const x = (e.clientX - rect.left) / Math.max(1, rect.width);
      const y = (e.clientY - rect.top) / Math.max(1, rect.height);
      const text = window.prompt("Comment:");
      if (!text || !text.trim()) return;
      await create(compId, text.trim(), { pos: { x, y } });
      await onAfterCreate();
      e.preventDefault();
      e.stopPropagation();
    };
    canvas.addEventListener('click', handler, true);
    return () => canvas.removeEventListener('click', handler, true);
  }, [canvasRef, create, onAfterCreate]);
}

export default useAltClickCreate;

