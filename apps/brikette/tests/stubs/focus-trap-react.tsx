import type { ReactNode } from "react";

type Props = {
  children?: ReactNode;
};

export default function FocusTrap({ children }: Props): ReactNode {
  return children ?? null;
}

export function FocusTrapComponent({ children }: Props): ReactNode {
  return children ?? null;
}

export const FocusTrap = FocusTrapComponent;

