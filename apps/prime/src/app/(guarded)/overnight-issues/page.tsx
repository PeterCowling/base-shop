'use client';

import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function OvernightIssuesPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md text-center">
        <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-amber-500" />
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Overnight Issues</h1>
        <p className="mb-8 text-gray-600">Report overnight issues here.</p>
        <Link href="/" className="text-blue-600 hover:underline">Return Home</Link>
      </div>
    </main>
  );
}
