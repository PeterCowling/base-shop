import { z } from "zod";
import { componentMetadataSchema } from "./component.schema";
import { layoutSchema } from "./layout.schema";

const editorFlagsSchema = z.object({
  name: z.string().optional(),
  locked: z.boolean().optional(),
  zIndex: z.number().int().optional(),
  hidden: z.array(z.enum(["desktop", "tablet", "mobile"])).optional(),
  hiddenDeviceIds: z.array(z.string()).optional(),
  // Legacy single strategy (mobile); kept for backwards-compat
  stackStrategy: z.enum(["default", "reverse", "custom"]).optional(),
  // Per-device strategies
  stackDesktop: z.enum(["default", "reverse", "custom"]).optional(),
  stackTablet: z.enum(["default", "reverse", "custom"]).optional(),
  stackMobile: z.enum(["default", "reverse", "custom"]).optional(),
  // Per-device custom order values
  orderDesktop: z.number().int().nonnegative().optional(),
  orderTablet: z.number().int().nonnegative().optional(),
  orderMobile: z.number().int().nonnegative().optional(),
});

export const historyStateSchema: z.ZodType<unknown> = z
  .object({
    past: z.array(z.array(componentMetadataSchema)),
    present: z.array(componentMetadataSchema),
    future: z.array(z.array(componentMetadataSchema)),
  })
  .merge(layoutSchema.removeDefault())
  .extend({
    editor: z.record(editorFlagsSchema).default({}),
  })
  .strict()
  .default({ past: [], present: [], future: [], gridCols: 12, editor: {} });
