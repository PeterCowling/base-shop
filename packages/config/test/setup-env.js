const mutableEnv = process.env;

const ensureSecret = (key, fallback) => {
  const current = mutableEnv[key];
  if (!current || current.length < 32) {
    mutableEnv[key] = fallback;
  }
};

ensureSecret("NEXTAUTH_SECRET", "test-nextauth-secret-32-chars-long-string!");
ensureSecret("SESSION_SECRET", "test-session-secret-32-chars-long-string!");
ensureSecret("CART_COOKIE_SECRET", "test-cart-cookie-secret-32-chars-long!");

mutableEnv.CMS_SPACE_URL ||= "https://cms.example.com";
mutableEnv.CMS_ACCESS_TOKEN ||= "cms-access-token";
mutableEnv.SANITY_API_VERSION ||= "2023-01-01";
mutableEnv.AUTH_TOKEN_TTL ||= "15m";
mutableEnv.EMAIL_FROM ||= "test@example.com";
mutableEnv.EMAIL_PROVIDER ||= "noop";
mutableEnv.LOGIN_RATE_LIMIT_REDIS_URL ||= "https://example.com";
mutableEnv.LOGIN_RATE_LIMIT_REDIS_TOKEN ||= "token-value-32-chars-long-string!!";
mutableEnv.UPSTASH_REDIS_REST_URL ||= "https://example.com";
mutableEnv.UPSTASH_REDIS_REST_TOKEN ||= "token-value-32-chars-long-string!!";
mutableEnv.JWT_SECRET ||= "jwt-secret-32-chars-long-string!!!!";
mutableEnv.OAUTH_CLIENT_ID ||= "oauth-client-id";
mutableEnv.OAUTH_CLIENT_SECRET ||= "oauth-client-secret-32-chars-long-string!!!";
