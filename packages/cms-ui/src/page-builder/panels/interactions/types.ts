import type { PageComponent } from "@acme/types";

export type HandleInput = <K extends keyof PageComponent>(
  field: K,
  value: PageComponent[K],
) => void;

export interface InteractionsProps {
  component: PageComponent;
  handleInput: HandleInput;
}

