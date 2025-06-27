// apps/cms/src/app/page.tsx

import { authOptions } from "@cms/auth/options";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function IndexPage() {
  const session = await getServerSession(authOptions);
  redirect(session ? "/cms" : "/login");
}
