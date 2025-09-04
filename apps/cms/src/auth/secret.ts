// apps/cms/src/auth/secret.ts

// Allow tests and local development to run without configuring a secret.
// `NEXTAUTH_SECRET` is still required in production to ensure sessions are
// cryptographically signed.
// Treat an empty string the same as an undefined secret so tests running with
// `NEXTAUTH_SECRET=""` don't throw. In production an explicit secret remains
// required.
const provided = process.env.NEXTAUTH_SECRET;
const secret =
  provided && provided.trim() !== ""
    ? provided
    : process.env.NODE_ENV === "production"
    ? undefined
    : "test-secret";

if (!secret) {
  throw new Error("NEXTAUTH_SECRET is not set");
}

// Explicitly cast to string so consumers receive a correctly typed secret
export const authSecret = secret as string;
