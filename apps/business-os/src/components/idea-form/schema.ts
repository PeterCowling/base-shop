import { z } from "zod";

/**
 * Form schema for creating new ideas
 * Phase 0: Simple form with title, description, business
 */
export const createIdeaSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().min(1, "Description is required"),
  business: z.string().min(1, "Please select a business"),
  tags: z.string().optional(),
});

export type CreateIdeaFormData = z.infer<typeof createIdeaSchema>;
