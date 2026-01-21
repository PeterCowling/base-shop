import { z } from "zod";

export const paginationSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
});

export const shopIdSchema = z.object({
  shopId: z.string().min(1),
});

export const orderFilterSchema = paginationSchema.extend({
  shopId: z.string().optional(),
  status: z.string().optional(),
  customerId: z.string().optional(),
});

export const pageSlugSchema = z.object({
  shopId: z.string().min(1),
  slug: z.string().min(1),
});

export const sectionFilterSchema = paginationSchema.extend({
  shopId: z.string().min(1),
  status: z.enum(["draft", "published"]).optional(),
});

export function formatError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return `Validation error: ${error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

export function jsonResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}
