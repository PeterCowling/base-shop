// apps/shop-abc/src/app/account/profile/head.tsx
import { getCustomerSession, CSRF_TOKEN_COOKIE } from "@auth";
import { cookies } from "next/headers";

export default async function Head() {
  await getCustomerSession();
  const store = await cookies();
  const token = store.get(CSRF_TOKEN_COOKIE)?.value ?? "";
  return <meta name="csrf-token" content={token} />;
}

