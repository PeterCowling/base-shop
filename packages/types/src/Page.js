import { z } from "zod";
import { localeSchema } from "./Product";
export const pageSchema = z.object({
    id: z.string(),
    slug: z.string(),
    status: z.enum(["draft", "published"]),
    components: z
        .array(z.object({ id: z.string(), type: z.string() }).passthrough())
        .default([]),
    seo: z.object({
        title: z.record(localeSchema, z.string()),
        description: z.record(localeSchema, z.string()).optional(),
        image: z.record(localeSchema, z.string()).optional(),
    }),
    createdAt: z.string(),
    updatedAt: z.string(),
    createdBy: z.string(),
});
