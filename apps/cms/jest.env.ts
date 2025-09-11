const mutableEnv = process.env as Record<string, string>;
const ensureSecret = (key: string, fallback: string) => {
  const current = mutableEnv[key];
  if (!current || current.length < 32) {
    mutableEnv[key] = fallback;
  }
};
ensureSecret('NEXTAUTH_SECRET', 'test-nextauth-secret-32-chars-long-string!');
ensureSecret('SESSION_SECRET', 'test-session-secret-32-chars-long-string!');
mutableEnv.EMAIL_FROM ||= 'no-reply@example.com';
