// src/context/ModalContext.tsx
/* -------------------------------------------------------------------------- */
/*  Modal context re-export                                                   */
/* -------------------------------------------------------------------------- */

export {
  ModalContext,
  type ModalContextValue,
  type ModalProviderProps,
  type ModalType,
} from "@/context/modal/context";
export { useModal, useOptionalModal } from "@/context/modal/hooks";
export { ModalProvider } from "@/context/modal/provider";
