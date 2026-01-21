import { z } from "zod";

export const paginationSchema = z.object({
  page: z.number().min(1).optional().default(1),
  perPage: z.number().min(1).max(100).optional().default(25),
});

export const projectNameSchema = z.object({
  projectName: z.string().min(1),
});

export const zoneIdSchema = z.object({
  zoneId: z.string().min(1),
});

export const bucketNameSchema = z.object({
  bucketName: z.string().min(1),
});

export const namespaceIdSchema = z.object({
  namespaceId: z.string().min(1),
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
