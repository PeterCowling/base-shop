import { z } from "zod";

export const addressSchema = z.object({
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  postal_code: z.string(),
  country: z.string(),
  state: z.string().optional(),
});

export const shippingSchema = z.object({
  name: z.string(),
  address: addressSchema,
  phone: z.string().optional(),
});

export const billingSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  address: addressSchema,
  phone: z.string().optional(),
});

export type Address = z.infer<typeof addressSchema>;
export type Shipping = z.infer<typeof shippingSchema>;
export type Billing = z.infer<typeof billingSchema>;
