// apps/cms/src/actions/common/auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@cms/auth/options";

export async function ensureAuthorized() {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role === "viewer") {
    throw new Error("Forbidden");
  }
  return session;
}
