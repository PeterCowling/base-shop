// packages/config/src/env/index.ts
import "@acme/zod-utils/initZod";
import { z, type AnyZodObject } from "zod";
import { authTokenTtlSchema } from "./auth.js";
import { coreEnvBaseSchema, depositReleaseEnvRefinement } from "./core.js";
import { paymentsEnvSchema } from "./payments.js";
import { shippingEnvSchema } from "./shipping.js";

type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

type MergedShape<T extends readonly AnyZodObject[]> = UnionToIntersection<
  {
    [K in keyof T]: T[K] extends z.ZodObject<infer S extends z.ZodRawShape>
      ? S
      : never;
  }[number]
> &
  z.ZodRawShape;

export const mergeEnvSchemas = <T extends readonly AnyZodObject[]>(
  ...schemas: T
): z.ZodObject<MergedShape<T>> =>
  schemas.reduce((acc, s) => acc.merge(s), z.object({})) as z.ZodObject<
    MergedShape<T>
  >;

const mergedEnvSchema = mergeEnvSchemas(
  coreEnvBaseSchema,
  paymentsEnvSchema,
  shippingEnvSchema.innerType()
);

export const envSchema = mergedEnvSchema.superRefine(
  depositReleaseEnvRefinement
);

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid environment variables");
}

const ttlResult = authTokenTtlSchema.safeParse(parsed.data.AUTH_TOKEN_TTL);
if (!ttlResult.success) {
  console.error(
    "❌ Invalid auth environment variables:",
    ttlResult.error.format(),
  );
  throw new Error("Invalid auth environment variables");
}

export const env = {
  ...parsed.data,
  AUTH_TOKEN_TTL: ttlResult.data,
};
export type Env = Omit<z.infer<typeof envSchema>, "AUTH_TOKEN_TTL"> & {
  AUTH_TOKEN_TTL: z.infer<typeof authTokenTtlSchema>;
};

export * from "./auth.js";
export * from "./cms.js";
export * from "./core.js";
export * from "./email.js";
export * from "./payments.js";
export * from "./shipping.js";
