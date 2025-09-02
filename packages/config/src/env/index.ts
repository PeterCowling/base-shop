// packages/config/src/env/index.ts
import "@acme/zod-utils/initZod";
import { z, type AnyZodObject } from "zod";
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

function unwrapEffects(schema: AnyZodObject): AnyZodObject {
  // Zod's refinement helpers wrap objects in `ZodEffects`.  Rely on the
  // presence of `innerType()` instead of `instanceof` so this works even if
  // multiple Zod copies exist in the dependency graph.
  let current: any = schema;
  while (typeof current?.innerType === "function") {
    current = current.innerType();
  }
  return current as AnyZodObject;
}

export const mergeEnvSchemas = <T extends readonly AnyZodObject[]>(
  ...schemas: T
): z.ZodObject<MergedShape<T>> =>
  schemas.reduce<AnyZodObject>(
    (acc, s) => acc.merge(unwrapEffects(s)),
    z.object({})
  ) as z.ZodObject<MergedShape<T>>;

const mergedEnvSchema = mergeEnvSchemas(
  coreEnvBaseSchema,
  paymentsEnvSchema,
  shippingEnvSchema
);

export const envSchema = mergedEnvSchema.superRefine(
  depositReleaseEnvRefinement
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
export * from "./core.js";
export * from "./email.js";
export * from "./payments.js";
export * from "./shipping.js";
