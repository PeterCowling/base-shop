import { redirect } from "next/navigation";

export default function RootPage() {
  // Root redirects to /bar (matching legacy behavior from AppRoutes.tsx)
  redirect("/bar");
}
