const mutableEnv = process.env as Record<string, string>;
const ensureSecret = (key: string, fallback: string) => {
  const current = mutableEnv[key];
  if (!current || current.length < 32) {
    mutableEnv[key] = fallback;
  }
};
ensureSecret('NEXTAUTH_SECRET', 'test-nextauth-secret-32-chars-long-string!'); // i18n-exempt -- INTL-000 test-only fallback for deterministic local runs [ttl=2026-03-31]
ensureSecret('SESSION_SECRET', 'test-session-secret-32-chars-long-string!'); // i18n-exempt -- INTL-000 test-only fallback for deterministic local runs [ttl=2026-03-31]
mutableEnv.EMAIL_FROM ??= 'test@example.com'; // i18n-exempt -- INTL-000 test-only sender address for local jest env [ttl=2026-03-31]
// Opt-in test fallback in ensureAuthorized when no mock session is set
mutableEnv.CMS_TEST_ASSUME_ADMIN ??= '1';
