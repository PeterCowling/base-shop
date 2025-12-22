// src/context/modal/Loader.tsx
/* -------------------------------------------------------------------------- */
/*  Loader shown while lazy modals resolve                                    */
/* -------------------------------------------------------------------------- */

export function Loader(): JSX.Element {
  return (
    <div
      role="status"
      aria-label="loading"
      className="layer-modal-container layer-modal-backdrop grid place-items-center bg-brand-text/20 backdrop-blur-sm dark:bg-brand-bg/40"
    >
      <div className="size-10 animate-spin rounded-full border-4 border-brand-bougainvillea border-t-transparent opacity-50" />
    </div>
  );
}
