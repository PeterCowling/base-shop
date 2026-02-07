import type { Locale } from "@acme/i18n/locales";
import type { PageComponent } from "@acme/types";
declare function Block({ component, locale }: {
    component: PageComponent;
    locale: Locale;
}): import("react/jsx-runtime").JSX.Element | null;
declare const _default: import("react").MemoExoticComponent<typeof Block>;
export default _default;