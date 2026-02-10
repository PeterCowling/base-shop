'use client';

import Link from 'next/link';
import { Wine } from 'lucide-react';

export default function BarMenuPage() {
  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="mx-auto max-w-md text-center">
        <Wine className="mx-auto mb-4 h-16 w-16 text-accent" />
        <h1 className="mb-2 text-2xl font-bold text-foreground">Bar Menu</h1>
        <p className="mb-8 text-muted-foreground">Bar menu coming soon.</p>
        <Link href="/" className="text-primary hover:underline">Return Home</Link>
      </div>
    </main>
  );
}
