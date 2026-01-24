// src/context/modal/Loader.tsx
/* -------------------------------------------------------------------------- */
/*  Loader shown while lazy modals resolve                                    */
/* -------------------------------------------------------------------------- */

export function Loader(): JSX.Element {
  return (
    <div
      role="status"
      aria-label="loading"
      className="fixed inset-0 layer-modal-backdrop grid place-items-center bg-black/20 backdrop-blur-sm dark:bg-black/40"
    >
    <div className="size-10 animate-spin motion-reduce:animate-none rounded-full border-4 border-[var(--color-brand-bougainvillea)] border-t-transparent opacity-50" />
    </div>
  );
}
