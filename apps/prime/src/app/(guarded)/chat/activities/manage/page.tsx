'use client';

import Link from 'next/link';
import { Settings } from 'lucide-react';

export default function ManageActivitiesPage() {
  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="mx-auto max-w-md text-center">
        <Settings className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">Manage Activities</h1>
        <p className="mb-8 text-muted-foreground">Activity management coming soon.</p>
        <Link href="/" className="text-primary hover:underline">Return Home</Link>
      </div>
    </main>
  );
}
