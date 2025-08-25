import { z } from "zod";
import { componentMetadataSchema } from "./component.schema";
import { layoutSchema } from "./layout.schema";

export const historyStateSchema = z
  .object({
    past: z.array(z.array(componentMetadataSchema)),
    present: z.array(componentMetadataSchema),
    future: z.array(z.array(componentMetadataSchema)),
  })
  .merge(layoutSchema.removeDefault())
  .strict()
  .default({ past: [], present: [], future: [], gridCols: 12 });
