import { Metadata } from "next";
import { ValidationDashboard } from "./ValidationDashboard";

export const metadata: Metadata = {
  title: "Guide Validation | Draft Tools",
  robots: "noindex,nofollow",
};

export const dynamic = "force-dynamic";

export default function ValidationPage() {
  return <ValidationDashboard />;
}
