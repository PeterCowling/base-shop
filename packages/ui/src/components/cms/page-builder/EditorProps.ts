import type { PageComponent } from "@acme/types";
import type { LazyExoticComponent, ComponentType } from "react";

// Shared prop contract for all content editors used in the page builder.
export interface EditorProps<T = PageComponent> {
  component: T;
  onChange: (patch: Partial<T>) => void;
}

// Convenience alias for a lazily loaded editor component using the shared props.
export type AnyEditor = LazyExoticComponent<ComponentType<EditorProps>>;
