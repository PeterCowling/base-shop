// Mock for @acme/ui/context/ModalContext in Jest tests
// Avoids the environment.ts import.meta dependency
import { createContext, useContext, type ReactNode } from "react";

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

export const useModal = (): ModalContextValue => {
  const ctx = useContext(ModalContext);
  return ctx ?? ssrStub;
};
// Optional modal hook reads from context so Provider-wrapped tests work correctly.
export const useOptionalModal = (): ModalContextValue => {
  const ctx = useContext(ModalContext);
  return ctx ?? ssrStub;
};

export const ModalProvider = ({ children }: ModalProviderProps) => {
  return <ModalContext.Provider value={ssrStub}>{children}</ModalContext.Provider>;
};
