import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((v) => v.toLowerCase());

export const subjectSchema = z
  .string()
  .trim()
  .min(1, "Email subject is required");

