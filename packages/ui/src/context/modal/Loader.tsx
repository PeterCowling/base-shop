// src/context/modal/Loader.tsx
/* -------------------------------------------------------------------------- */
/*  Loader shown while lazy modals resolve                                    */
/* -------------------------------------------------------------------------- */

export function Loader(): JSX.Element {
  return (
    <div
      role="status"
      aria-label="loading"
      className="fixed inset-0 layer-modal-backdrop grid place-items-center bg-surface/20 backdrop-blur-sm dark:bg-surface/40"
    >
    <div className="size-11 animate-spin motion-reduce:animate-none rounded-full border-4 border-border-2 border-t-transparent opacity-50" />
    </div>
  );
}
