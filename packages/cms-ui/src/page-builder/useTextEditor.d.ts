import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
type TextComponent = PageComponent & {
    type: "Text";
    text?: string | Record<string, string>;
};
export default function useTextEditor(component: TextComponent, locale: Locale, editing: boolean): import("@tiptap/core").Editor | null;
export {};
//# sourceMappingURL=useTextEditor.d.ts.map