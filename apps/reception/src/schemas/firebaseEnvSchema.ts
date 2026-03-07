import { z } from "zod";

// Tests may parse synthetic fixture objects that intentionally omit env values.
const isTest = process.env.NODE_ENV === "test";

const requiredString = (message: string) =>
  isTest ? z.string().optional().default("") : z.string().min(1, message);

export const firebaseEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: requiredString("NEXT_PUBLIC_FIREBASE_API_KEY is required"),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: requiredString("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is required"),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: requiredString("NEXT_PUBLIC_FIREBASE_PROJECT_ID is required"),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: requiredString(
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is required"
  ),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: requiredString(
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID is required"
  ),
  NEXT_PUBLIC_FIREBASE_APP_ID: requiredString("NEXT_PUBLIC_FIREBASE_APP_ID is required"),
  NEXT_PUBLIC_FIREBASE_DATABASE_URL: requiredString(
    "NEXT_PUBLIC_FIREBASE_DATABASE_URL is required"
  ),
  NEXT_PUBLIC_FIREBASE_ARCHIVE_DATABASE_URL: z.string().optional(),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: requiredString(
    "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID is required"
  ),
});

export type FirebaseEnv = z.infer<typeof firebaseEnvSchema>;
