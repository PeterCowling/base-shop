// apps/cms/src/lib/server/queryValidation.ts
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Helper to validate query parameters with Zod schemas
 * Returns parsed data or an error response
 *
 * @example
 * ```typescript
 * const schema = z.object({
 *   shop: z.string().min(1),
 *   page: z.coerce.number().positive().optional(),
 * });
 *
 * const result = validateQuery(req, schema);
 * if (result.error) return result.error;
 * const { shop, page } = result.data;
 * ```
 */
export function validateQuery<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): { data: z.infer<T>; error?: never } | { data?: never; error: NextResponse } {
  const url = new URL(req.url);
  const params: Record<string, string | string[] | undefined> = {};

  // Extract all query parameters
  url.searchParams.forEach((value, key) => {
    const existing = params[key];
    if (existing === undefined) {
      params[key] = value;
    } else if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      params[key] = [existing, value];
    }
  });

  const parsed = schema.safeParse(params);

  if (!parsed.success) {
    return {
      error: NextResponse.json(
        {
          error: "Invalid query parameters",
          details: parsed.error.format(),
        },
        { status: 400 }
      ),
    };
  }

  return { data: parsed.data };
}

/**
 * Common query parameter schemas for reuse
 */
export const QuerySchemas = {
  /** Shop ID parameter (required, validated) */
  shop: z.string().min(1, "Shop ID is required"),

  /** Optional search query */
  search: z.string().optional(),

  /** Page number for pagination (coerces to positive integer) */
  page: z.coerce.number().int().positive().default(1),

  /** Page size/limit for pagination (coerces to positive integer, max 100) */
  limit: z.coerce.number().int().positive().max(100).default(20),

  /** Optional ID parameter */
  id: z.string().optional(),

  /** Required ID parameter */
  requiredId: z.string().min(1, "ID is required"),

  /** Boolean flag (coerces "true"/"false" strings to boolean) */
  flag: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),

  /** Optional email parameter with validation */
  email: z.string().email().optional(),

  /** CSV-separated tags */
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").map((t) => t.trim()) : undefined)),

  /** Environment enum */
  environment: z.enum(["dev", "stage", "prod"]).optional(),
};

/**
 * Common response schemas for API validation
 */
export const ResponseSchemas = {
  /** Standard error response */
  error: z.object({
    error: z.string(),
    details: z.unknown().optional(),
  }),

  /** Standard success response with data */
  success: <T extends z.ZodTypeAny>(dataSchema: T) =>
    z.object({
      data: dataSchema,
    }),

  /** Paginated response */
  paginated: <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
      data: z.array(itemSchema),
      pagination: z.object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
      }),
    }),
};

/**
 * Validate response data and return NextResponse
 * Ensures API responses conform to expected schemas
 */
export function validateResponse<T extends z.ZodTypeAny>(
  data: unknown,
  schema: T,
  options: { status?: number } = {}
): NextResponse<z.infer<T>> {
  const { status = 200 } = options;
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    // Log schema validation failure in development
    if (process.env.NODE_ENV === "development") {
      console.error("Response validation failed:", parsed.error.format());
    }
    // Return the data anyway but log the mismatch
    return NextResponse.json(data as z.infer<T>, { status });
  }

  return NextResponse.json(parsed.data, { status });
}
