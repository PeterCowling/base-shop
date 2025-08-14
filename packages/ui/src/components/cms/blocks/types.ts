import type { ComponentType } from "react";
import type { PageComponent } from "@acme/types";
import type { Locale } from "@/i18n/locales";

export interface BlockRegistryEntry<P> {
  component: ComponentType<P>;
  getRuntimeProps?: (
    block: PageComponent,
    locale: Locale
  ) => Partial<P> | Promise<Partial<P>>;
}
