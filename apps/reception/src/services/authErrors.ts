/**
 * Shared Firebase Auth error mapper for Reception app.
 * Used by firebaseAuth.ts and managerReauth.ts.
 */
export function mapAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Authentication failed";
  if (message.includes("auth/invalid-credential") || message.includes("auth/wrong-password")) {
    return "Invalid email or password.";
  }
  if (message.includes("auth/user-not-found")) {
    return "No account found with this email.";
  }
  if (message.includes("auth/too-many-requests")) {
    return "Too many failed attempts. Please try again later.";
  }
  if (message.includes("auth/network-request-failed")) {
    return "Network error. Check your connection.";
  }
  return message;
}
