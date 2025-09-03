// apps/cms/src/auth/secret.ts

const secret = process.env.NEXTAUTH_SECRET;

if (!secret) {
  throw new Error("NEXTAUTH_SECRET is not set");
}

// Explicitly cast to string so consumers receive a correctly typed secret
export const authSecret = secret as string;
