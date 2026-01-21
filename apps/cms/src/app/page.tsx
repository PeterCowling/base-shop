// apps/cms/src/app/page.tsx

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@cms/auth/options";

export default async function IndexPage() {
  const session = await getServerSession(authOptions);
  redirect(session ? "/cms" : "/login");
}
