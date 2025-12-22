// src/context/modal/context.ts
/* -------------------------------------------------------------------------- */
/*  Modal context definitions                                                 */
/* -------------------------------------------------------------------------- */

import { createContext, type ReactNode } from "react";

export type ModalType =
  | "offers"
  | "booking"
  | "booking2"
  | "location"
  | "contact"
  | "facilities"
  | "language"
  | null;

export interface ModalContextValue {
  activeModal: ModalType;
  modalData: unknown;
  openModal: (type: Exclude<ModalType, null>, data?: unknown) => void;
  closeModal: () => void;
}

export interface ModalProviderProps {
  readonly children: ReactNode;
}

export const ModalContext = createContext<ModalContextValue | null>(null);

export const ssrStub: ModalContextValue = {
  activeModal: null,
  modalData: null,
  /* istanbul ignore next */
  openModal: () => {},
  /* istanbul ignore next */
  closeModal: () => {},
};
