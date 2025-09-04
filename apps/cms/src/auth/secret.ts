// apps/cms/src/auth/secret.ts

let secret = process.env.NEXTAUTH_SECRET;

if (!secret) {
  secret = "test-secret";
}

// Explicitly cast to string so consumers receive a correctly typed secret
export const authSecret = secret as string;
