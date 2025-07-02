import { z } from "zod";
import { type Locale, type Translated } from "./Product";
export declare const shopSeoFieldsSchema: z.ZodObject<
  {
    canonicalBase: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    image: z.ZodOptional<z.ZodString>;
    openGraph: z.ZodOptional<
      z.ZodObject<
        {
          title: z.ZodOptional<z.ZodString>;
          description: z.ZodOptional<z.ZodString>;
          url: z.ZodOptional<z.ZodString>;
          image: z.ZodOptional<z.ZodString>;
        },
        "strip",
        z.ZodTypeAny,
        {
          url?: string;
          title?: string;
          image?: string;
          description?: string;
        },
        {
          url?: string;
          title?: string;
          image?: string;
          description?: string;
        }
      >
    >;
    twitter: z.ZodOptional<
      z.ZodObject<
        {
          card: z.ZodOptional<z.ZodString>;
          title: z.ZodOptional<z.ZodString>;
          description: z.ZodOptional<z.ZodString>;
          image: z.ZodOptional<z.ZodString>;
        },
        "strip",
        z.ZodTypeAny,
        {
          title?: string;
          image?: string;
          description?: string;
          card?: string;
        },
        {
          title?: string;
          image?: string;
          description?: string;
          card?: string;
        }
      >
    >;
    structuredData: z.ZodOptional<z.ZodString>;
  },
  "strip",
  z.ZodTypeAny,
  {
    title?: string;
    image?: string;
    description?: string;
    canonicalBase?: string;
    openGraph?: {
      url?: string;
      title?: string;
      image?: string;
      description?: string;
    };
    twitter?: {
      title?: string;
      image?: string;
      description?: string;
      card?: string;
    };
    structuredData?: string;
  },
  {
    title?: string;
    image?: string;
    description?: string;
    canonicalBase?: string;
    openGraph?: {
      url?: string;
      title?: string;
      image?: string;
      description?: string;
    };
    twitter?: {
      title?: string;
      image?: string;
      description?: string;
      card?: string;
    };
    structuredData?: string;
  }
>;
export type ShopSeoFields = z.infer<typeof shopSeoFieldsSchema>;
export interface Shop {
  id: string;
  name: string;
  catalogFilters: string[];
  themeId: string;
  /** Mapping of design tokens to theme values */
  themeTokens: Record<string, string>;
  /** Mapping of logical filter keys to catalog attributes */
  filterMappings: Record<string, string>;
  /** Optional price overrides per locale (minor units) */
  priceOverrides: Partial<Record<Locale, number>>;
  /** Optional redirect overrides for locale detection */
  localeOverrides: Record<string, Locale>;
  homeTitle?: Translated;
  homeDescription?: Translated;
  homeImage?: string;
  navigation?: {
    label: string;
    url: string;
  }[];
}
export declare const shopSchema: z.ZodObject<
  {
    id: z.ZodString;
    name: z.ZodString;
    catalogFilters: z.ZodArray<z.ZodString, "many">;
    themeId: z.ZodString;
    /** Mapping of design tokens to theme values */
    themeTokens: z.ZodRecord<z.ZodString, z.ZodString>;
    /** Mapping of logical filter keys to catalog attributes */
    filterMappings: z.ZodRecord<z.ZodString, z.ZodString>;
    /** Optional price overrides per locale (minor units) */
    priceOverrides: z.ZodDefault<
      z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodNumber>
    >;
    /** Optional redirect overrides for locale detection */
    localeOverrides: z.ZodDefault<
      z.ZodRecord<z.ZodString, z.ZodEnum<["en", "de", "it"]>>
    >;
    homeTitle: z.ZodOptional<
      z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>
    >;
    homeDescription: z.ZodOptional<
      z.ZodRecord<z.ZodEnum<["en", "de", "it"]>, z.ZodString>
    >;
    homeImage: z.ZodOptional<z.ZodString>;
    navigation: z.ZodOptional<
      z.ZodArray<
        z.ZodObject<
          {
            label: z.ZodString;
            url: z.ZodString;
          },
          "strip",
          z.ZodTypeAny,
          {
            label?: string | undefined;
            url?: string | undefined;
          },
          {
            label?: string | undefined;
            url?: string | undefined;
          }
        >,
        "many"
      >
    >;
  },
  "strip",
  z.ZodTypeAny,
  {
    name?: string;
    id?: string;
    catalogFilters?: string[];
    themeId?: string;
    themeTokens?: Record<string, string>;
    filterMappings?: Record<string, string>;
    priceOverrides?: Partial<Record<"en" | "de" | "it", number>>;
    localeOverrides?: Record<string, "en" | "de" | "it">;
    homeTitle?: Partial<Record<"en" | "de" | "it", string>>;
    homeDescription?: Partial<Record<"en" | "de" | "it", string>>;
    homeImage?: string;
    navigation?: {
      label?: string;
      url?: string;
    }[];
  },
  {
    name?: string;
    id?: string;
    catalogFilters?: string[];
    themeId?: string;
    themeTokens?: Record<string, string>;
    filterMappings?: Record<string, string>;
    priceOverrides?: Partial<Record<"en" | "de" | "it", number>>;
    localeOverrides?: Record<string, "en" | "de" | "it">;
    homeTitle?: Partial<Record<"en" | "de" | "it", string>>;
    homeDescription?: Partial<Record<"en" | "de" | "it", string>>;
    homeImage?: string;
    navigation?: {
      label?: string;
      url?: string;
    }[];
  }
>;
//# sourceMappingURL=Shop.d.ts.map
