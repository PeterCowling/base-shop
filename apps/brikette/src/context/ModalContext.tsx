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
export { ModalProvider } from "@/context/modal/provider";
export { useModal, useOptionalModal } from "@/context/modal/hooks";
