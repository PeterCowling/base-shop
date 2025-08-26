import "@acme/zod-utils/initZod";
import { z } from "zod";
import {
  coreEnvBaseSchema,
  depositReleaseEnvRefinement,
} from "./core.js";
import { paymentEnvSchema } from "./payments.js";
import { shippingEnvSchema } from "./shipping.js";

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never;

type AnyZodObject = z.ZodObject<z.ZodRawShape, any, any, any, any>;

type MergedShape<T extends readonly AnyZodObject[]> =
  UnionToIntersection<
    {
      [K in keyof T]: T[K] extends z.ZodObject<
        infer S extends z.ZodRawShape,
        any,
        any,
        any,
        any
      >
        ? S
        : never;
    }[number]
  > &
  z.ZodRawShape;

export const mergeEnvSchemas = <T extends readonly AnyZodObject[]>(
  ...schemas: T
): z.ZodObject<MergedShape<T>> =>
  schemas.reduce(
    (acc, s) => acc.merge(s),
    z.object({})
  ) as z.ZodObject<MergedShape<T>>;

const mergedEnvSchema = mergeEnvSchemas(
  coreEnvBaseSchema,
  paymentEnvSchema,
  shippingEnvSchema,
);

export const envSchema = mergedEnvSchema.superRefine(
  depositReleaseEnvRefinement,
);

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;

export * from "./auth.js";
export * from "./cms.js";
export * from "./email.js";
export * from "./core.js";
export * from "./payments.js";
export * from "./shipping.js";
