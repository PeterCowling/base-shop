import { z } from "zod";

export const creditCardSchema = z.object({
  cardNumber: z
    .string()
    .refine((val) => /^\d{13,16}$/.test(val.replace(/\s+/g, "")), {
      message: "Card number must be 13-16 digits",
    }),
  expiry: z.string().refine((val) => /^(0[1-9]|1[0-2])\/\d{2}$/.test(val), {
    message: "Expiry must be in MM/YY format",
  }),
});

export type CreditCardInput = z.input<typeof creditCardSchema>;
export type CreditCard = z.infer<typeof creditCardSchema>;
