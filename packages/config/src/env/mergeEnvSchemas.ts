import {
  z,
  type ZodTypeAny,
  ZodEffects,
  type AnyZodObject,
} from "zod";

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type UnwrapEffects<T extends ZodTypeAny> = T extends ZodEffects<infer U>
  ? UnwrapEffects<U>
  : T;

type MergedShape<T extends readonly ZodTypeAny[]> = UnionToIntersection<
  {
    [K in keyof T]: UnwrapEffects<T[K]> extends z.ZodObject<
      infer S extends z.ZodRawShape
    >
      ? S
      : never;
  }[number]
> &
  z.ZodRawShape;

function unwrap(schema: ZodTypeAny): AnyZodObject {
  let current: ZodTypeAny = schema;
  while (current instanceof ZodEffects) {
    current = current._def.schema;
  }
  return current as AnyZodObject;
}

export const mergeEnvSchemas = <T extends readonly ZodTypeAny[]>(
  ...schemas: T
): z.ZodObject<MergedShape<T>> =>
  schemas.reduce<AnyZodObject>(
    (acc, schema) => acc.merge(unwrap(schema)),
    z.object({})
  ) as z.ZodObject<MergedShape<T>>;
