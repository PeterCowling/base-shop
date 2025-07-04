import { z } from "zod";
/**
 * Enum-like string union for supported image orientations.
 */
export const imageOrientationSchema = z.enum(["portrait", "landscape"]);
