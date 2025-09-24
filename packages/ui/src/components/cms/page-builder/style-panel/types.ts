import type { PageComponent } from "@acme/types";

export type TrackFn = (name: string, payload?: Record<string, unknown>) => void;

export interface StylePanelProps {
  component: PageComponent;
  handleInput: <K extends keyof PageComponent>(field: K, value: PageComponent[K]) => void;
}
