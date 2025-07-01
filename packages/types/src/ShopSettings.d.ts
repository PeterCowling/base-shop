import { z } from "zod";
export declare const shopSettingsSchema: z.ZodObject<
  {
    languages: z.ZodReadonly<z.ZodArray<z.ZodEnum<["en", "de", "it"]>, "many">>;
    seo: z.ZodRecord<
      z.ZodEnum<["en", "de", "it"]>,
      z.ZodObject<
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
                title?: string | undefined;
                description?: string | undefined;
                url?: string | undefined;
                image?: string | undefined;
              },
              {
                title?: string | undefined;
                description?: string | undefined;
                url?: string | undefined;
                image?: string | undefined;
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
                card?: string | undefined;
                title?: string | undefined;
                description?: string | undefined;
                image?: string | undefined;
              },
              {
                card?: string | undefined;
                title?: string | undefined;
                description?: string | undefined;
                image?: string | undefined;
              }
            >
          >;
          structuredData: z.ZodOptional<z.ZodString>;
        },
        "strip",
        z.ZodTypeAny,
        {
          canonicalBase?: string;
          title?: string;
          description?: string;
          image?: string;
          openGraph?:
            | {
                title?: string | undefined;
                description?: string | undefined;
                url?: string | undefined;
                image?: string | undefined;
              }
            | undefined;
          twitter?:
            | {
                card?: string | undefined;
                title?: string | undefined;
                description?: string | undefined;
                image?: string | undefined;
              }
            | undefined;
          structuredData?: string;
        },
        {
          canonicalBase?: string;
          title?: string;
          description?: string;
          image?: string;
          openGraph?:
            | {
                title?: string | undefined;
                description?: string | undefined;
                url?: string | undefined;
                image?: string | undefined;
              }
            | undefined;
          twitter?:
            | {
                card?: string | undefined;
                title?: string | undefined;
                description?: string | undefined;
                image?: string | undefined;
              }
            | undefined;
          structuredData?: string;
        }
      >
    >;
    updatedAt: z.ZodString;
    updatedBy: z.ZodString;
  },
  "strip",
  z.ZodTypeAny,
  {
    languages?: readonly ("en" | "de" | "it")[];
    seo?: Partial<
      Record<
        "en" | "de" | "it",
        {
          canonicalBase?: string;
          title?: string;
          description?: string;
          image?: string;
        }
      >
    >;
    updatedAt?: string;
    updatedBy?: string;
  },
  {
    languages?: readonly ("en" | "de" | "it")[];
    seo?: Partial<
      Record<
        "en" | "de" | "it",
        {
          canonicalBase?: string;
          title?: string;
          description?: string;
          image?: string;
        }
      >
    >;
    updatedAt?: string;
    updatedBy?: string;
  }
>;
export type ShopSettings = z.infer<typeof shopSettingsSchema>;
//# sourceMappingURL=ShopSettings.d.ts.map
