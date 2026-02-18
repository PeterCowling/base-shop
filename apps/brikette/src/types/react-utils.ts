// Shared React type utilities and type guards

import { isValidElement, type ReactElement, type ReactNode } from "react";

export type FunctionComponentElement = ReactElement & {
  type: (props: unknown) => ReactNode;
};

export function isFunctionComponentElement(
  node: ReactNode,
): node is FunctionComponentElement {
  return (
    isValidElement(node) &&
    typeof (node as ReactElement).type === "function"
  );
}
