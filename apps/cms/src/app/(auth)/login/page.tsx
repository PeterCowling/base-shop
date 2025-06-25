// apps/cms/src/app/(auth)/login/page.tsx

import LoginForm from "./LoginForm";

export default async function LoginPage() {
  return <LoginForm fallbackUrl={fallbackUrl} />;
}
