import type { Metadata } from "next";

import ValidationDashboard from "./ValidationDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guide Validation — Business OS",
};

export default function ValidationPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <ValidationDashboard />
    </main>
  );
}
