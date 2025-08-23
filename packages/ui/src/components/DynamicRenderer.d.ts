import { type BlockType } from "./cms/blocks";
import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
export default function DynamicRenderer({ components, locale, runtimeData, }: {
    components: PageComponent[];
    locale: Locale;
    runtimeData?: Partial<Record<BlockType, Record<string, unknown>>>;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=DynamicRenderer.d.ts.map