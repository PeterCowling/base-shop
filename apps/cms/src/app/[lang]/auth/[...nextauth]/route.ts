// apps/cms/src/app/api/auth/[...nextauth]/route.ts
import { authOptions } from "@cms/auth/options";
import NextAuth from "next-auth";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
