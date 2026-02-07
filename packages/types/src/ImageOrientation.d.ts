import { z } from "zod";
/**
 * Enum-like string union for supported image orientations.
 */
export declare const imageOrientationSchema: z.ZodEnum<["portrait", "landscape"]>;
export type ImageOrientation = z.infer<typeof imageOrientationSchema>;
//# sourceMappingURL=ImageOrientation.d.ts.map