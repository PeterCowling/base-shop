import type { ComponentType } from "react";
import type { PageComponent } from "@acme/types";
import type { Locale } from "@acme/i18n/locales";
export interface BlockRegistryEntry<P> {
    component: ComponentType<P>;
    previewImage?: string;
    getRuntimeProps?: (block: PageComponent, locale: Locale) => Partial<P> | Promise<Partial<P>>;
}
//# sourceMappingURL=types.d.ts.map