// apps/cms/src/app/(auth)/login/page.tsx
import LoginForm from "./LoginForm";

/**
 * Default destination when no `callbackUrl` query param is present.
 * Adjust this value if your app has a different post-login landing route.
 */
const fallbackUrl: string = "/";

export default function LoginPage() {
  return <LoginForm fallbackUrl={fallbackUrl} />;
}
