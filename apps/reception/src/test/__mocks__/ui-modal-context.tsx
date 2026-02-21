// Mock for @acme/ui/context/ModalContext in Jest tests
// Avoids the environment.ts import.meta dependency
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
  openModal: () => {},
  closeModal: () => {},
};

export const useModal = (): ModalContextValue => ssrStub;
export const useOptionalModal = (): ModalContextValue | null => null;

export const ModalProvider = ({ children }: ModalProviderProps) => {
  return <ModalContext.Provider value={ssrStub}>{children}</ModalContext.Provider>;
};
