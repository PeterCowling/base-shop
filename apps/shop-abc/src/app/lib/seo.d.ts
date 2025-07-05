import type { Locale } from "@i18n/locales";
import type { NextSeoProps } from "next-seo";
export declare function getSeo(locale: Locale, pageSeo?: Partial<NextSeoProps>): Promise<NextSeoProps>;
