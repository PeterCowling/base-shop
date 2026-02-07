// src/context/ModalContext.tsx
/* -------------------------------------------------------------------------- */
/*  Barrel file for modal context utilities                                   */
/* -------------------------------------------------------------------------- */

export {
  ModalContext,
  type ModalContextValue,
  type ModalProviderProps,
  type ModalType,
  ssrStub,
} from "./modal/context";
export { useModal, useOptionalModal } from "./modal/hooks";
export { ModalProvider } from "./modal/provider";
