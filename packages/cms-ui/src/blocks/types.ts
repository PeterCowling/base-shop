import type { ComponentType } from "react";

import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";

export interface BlockRegistryEntry<P> {
  component: ComponentType<P>;
  previewImage?: string;
  getRuntimeProps?: (
    block: PageComponent,
    locale: Locale
  ) => Partial<P> | Promise<Partial<P>>;
}
