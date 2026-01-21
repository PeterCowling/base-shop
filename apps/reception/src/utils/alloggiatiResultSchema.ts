import { z } from "zod";

export const alloggiatiResultDetailSchema = z
  .object({
    recordNumber: z.string(),
    status: z.string().optional(),
    esito: z.boolean().optional(),
    erroreCod: z.string().optional(),
    erroreDes: z.string().optional(),
    erroreDettaglio: z.string().optional(),
    occupantRecord: z.string().optional(),
    occupantRecordLength: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === "ok") {
      return;
    }
    if (data.esito !== false) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "esito must be false when status is not ok",
        path: ["esito"],
      });
    }
    if (!data.erroreCod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "erroreCod required",
        path: ["erroreCod"],
      });
    }
    if (!data.erroreDes) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "erroreDes required",
        path: ["erroreDes"],
      });
    }
    if (!data.erroreDettaglio) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "erroreDettaglio required",
        path: ["erroreDettaglio"],
      });
    }
  });

export type AlloggiatiResultDetailSchema = z.infer<
  typeof alloggiatiResultDetailSchema
>;
